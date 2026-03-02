// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package internal_transformer_neuphonic

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	neuphonic_internal "github.com/rapidaai/api/assistant-api/internal/transformer/neuphonic/internal"
	internal_type "github.com/rapidaai/api/assistant-api/internal/type"
	"github.com/rapidaai/pkg/commons"
	"github.com/rapidaai/pkg/utils"
	"github.com/rapidaai/protos"
)

type neuphonicTTS struct {
	*neuphonicOption
	ctx       context.Context
	ctxCancel context.CancelFunc

	mu        sync.Mutex
	contextId string

	ttsStartedAt  time.Time
	ttsMetricSent bool

	logger     commons.Logger
	connection *websocket.Conn
	onPacket   func(pkt ...internal_type.Packet) error
}

func NewNeuPhonicTextToSpeech(ctx context.Context, logger commons.Logger, credential *protos.VaultCredential,
	onPacket func(pkt ...internal_type.Packet) error,
	opts utils.Option) (internal_type.TextToSpeechTransformer, error) {
	neuphonicOpts, err := NewNeuPhonicOption(logger, credential, opts)
	if err != nil {
		logger.Errorf("neuphonic-tts: initializing neuphonic failed %+v", err)
		return nil, err
	}
	ctx2, contextCancel := context.WithCancel(ctx)
	return &neuphonicTTS{
		ctx:             ctx2,
		ctxCancel:       contextCancel,
		onPacket:        onPacket,
		logger:          logger,
		neuphonicOption: neuphonicOpts,
	}, nil
}

func (ct *neuphonicTTS) Initialize() error {
	start := time.Now()
	header := http.Header{}
	header.Set("x-api-key", ct.GetKey())
	conn, resp, err := websocket.DefaultDialer.Dial(ct.GetTextToSpeechConnectionString(), header)
	if err != nil {
		ct.logger.Errorf("neuphonic-tts: error while connecting to neuphonic %s with response %v", err, resp)
		return err
	}

	ct.mu.Lock()
	ct.connection = conn
	defer ct.mu.Unlock()

	go ct.textToSpeechCallback(conn, ct.ctx)
	go ct.keepalive(conn, ct.ctx)
	ct.onPacket(internal_type.ConversationEventPacket{
		Name: "tts",
		Data: map[string]string{
			"type":     "initialized",
			"provider": ct.Name(),
			"init_ms":  fmt.Sprintf("%d", time.Since(start).Milliseconds()),
		},
		Time: time.Now(),
	})
	return nil
}

func (*neuphonicTTS) Name() string {
	return "neuphonic-text-to-speech"
}

func (rt *neuphonicTTS) keepalive(conn *websocket.Conn, ctx context.Context) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			rt.mu.Lock()
			if err := conn.WriteJSON(map[string]interface{}{
				"text": "",
			}); err != nil {
				rt.logger.Errorf("neuphonic-tts: keepalive write error: %v", err)
			}
			rt.mu.Unlock()
		}
	}
}

func (rt *neuphonicTTS) textToSpeechCallback(conn *websocket.Conn, ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			rt.logger.Infof("neuphonic-tts: context cancelled, stopping response listener")
			return
		default:
			_, audioChunk, err := conn.ReadMessage()
			if err != nil {
				if errors.Is(err, io.EOF) || websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
					rt.logger.Infof("neuphonic-tts: websocket closed gracefully")
					return
				}
				rt.logger.Errorf("neuphonic-tts: websocket read error: %v", err)
				return
			}
			var audioData neuphonic_internal.NeuPhonicTextToSpeechResponse
			if err := json.Unmarshal(audioChunk, &audioData); err != nil {
				rt.logger.Errorf("neuphonic-tts: error parsing audio chunk: %v", err)
				continue
			}

			if audioData.Data.Audio != "" {
				if rawAudioData, err := base64.StdEncoding.DecodeString(audioData.Data.Audio); err == nil {
					rt.mu.Lock()
					startedAt := rt.ttsStartedAt
					metricSent := rt.ttsMetricSent
					ctxId := rt.contextId
					if !metricSent && !startedAt.IsZero() {
						rt.ttsMetricSent = true
					}
					rt.mu.Unlock()
					if ctxId != "" {
						if !metricSent && !startedAt.IsZero() {
							rt.onPacket(internal_type.MessageMetricPacket{
								ContextID: ctxId,
								Metrics: []*protos.Metric{{
									Name:  "tts_latency_ms",
									Value: fmt.Sprintf("%d", time.Since(startedAt).Milliseconds()),
								}},
							})
						}
						rt.onPacket(internal_type.TextToSpeechAudioPacket{ContextID: ctxId, AudioChunk: rawAudioData})
					}
				} else {
					rt.logger.Errorf("neuphonic-tts: error decoding base64 audio: %v", err)
				}
			}
		}
	}
}

func (t *neuphonicTTS) Transform(ctx context.Context, in internal_type.LLMPacket) error {
	t.mu.Lock()
	cnn := t.connection
	currentCtx := t.contextId
	if in.ContextId() != t.contextId {
		t.contextId = in.ContextId()
		t.ttsStartedAt = time.Time{}
		t.ttsMetricSent = false
	}
	t.mu.Unlock()

	if cnn == nil {
		return fmt.Errorf("neuphonic-tts: websocket connection is not initialized")
	}

	switch input := in.(type) {
	case internal_type.InterruptionPacket:
		if currentCtx != "" {
			t.mu.Lock()
			t.ttsStartedAt = time.Time{}
			t.ttsMetricSent = false
			t.mu.Unlock()
			t.onPacket(internal_type.ConversationEventPacket{
				Name: "tts",
				Data: map[string]string{"type": "interrupted"},
				Time: time.Now(),
			})
		}
		return nil
	case internal_type.LLMResponseDeltaPacket:
		t.mu.Lock()
		if t.ttsStartedAt.IsZero() {
			t.ttsStartedAt = time.Now()
		}
		t.mu.Unlock()
		if err := cnn.WriteJSON(map[string]interface{}{
			"text": input.Text + " <STOP>",
		}); err != nil {
			t.logger.Errorf("neuphonic-tts: unable to write json for text to speech: %v", err)
		}
		t.onPacket(internal_type.ConversationEventPacket{
			Name: "tts",
			Data: map[string]string{
				"type": "speaking",
				"text": input.Text,
			},
			Time: time.Now(),
		})
	case internal_type.LLMResponseDonePacket:
		if err := cnn.WriteJSON(map[string]interface{}{
			"text": "<STOP>",
		}); err != nil {
			t.logger.Errorf("neuphonic-tts: unable to send stop signal: %v", err)
		}
		t.mu.Lock()
		ctxId := t.contextId
		t.mu.Unlock()
		if ctxId != "" {
			t.onPacket(
				internal_type.TextToSpeechEndPacket{ContextID: ctxId},
				internal_type.ConversationEventPacket{
					Name: "tts",
					Data: map[string]string{"type": "completed"},
					Time: time.Now(),
				},
			)
		}
		return nil
	default:
		return fmt.Errorf("neuphonic-tts: unsupported input type %T", in)
	}
	return nil
}

func (t *neuphonicTTS) Close(ctx context.Context) error {
	t.ctxCancel()
	t.mu.Lock()
	defer t.mu.Unlock()

	if t.connection != nil {
		t.connection.Close()
		t.connection = nil
	}
	return nil
}
