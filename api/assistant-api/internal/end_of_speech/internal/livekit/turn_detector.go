// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.
package internal_livekit

// #cgo CFLAGS: -Wall -Werror -std=c99
// #cgo LDFLAGS: -lonnxruntime
// #include "ort_bridge.h"
import "C"

import (
	"fmt"
	"math"
	"os"
	"path/filepath"
	"runtime"
	"unsafe"
)

const (
	turnDetectorName = "livekit_turn_detector"

	envModelPathKey     = "LIVEKIT_TURN_MODEL_PATH"
	envTokenizerPathKey = "LIVEKIT_TURN_TOKENIZER_PATH"

	defaultModelFile     = "models/model_q8.onnx"
	defaultTokenizerFile = "models/tokenizer.json"

	// imEndTokenID is the token ID for <|im_end|> in the SmolLM2 vocabulary.
	// Loaded from tokenizer.json added_tokens: {"content": "<|im_end|>", "id": 2}.
	imEndTokenID = 2

	// vocabSize is the output logits vocabulary dimension.
	// SmolLM2-135M base vocab (49152) + 3 added special tokens.
	vocabSize = 49155
)

// TurnDetectorConfig holds configuration for the turn detector ONNX model.
type TurnDetectorConfig struct {
	ModelPath     string
	TokenizerPath string
}

// TurnDetector manages the ONNX session for the LiveKit turn detection model.
// It tokenizes conversation text, runs inference, and returns the probability
// that the user has finished their turn (P(im_end)).
//
// NOT safe for concurrent use — the caller must serialize access.
type TurnDetector struct {
	api         *C.OrtApi
	env         *C.OrtEnv
	sessionOpts *C.OrtSessionOptions
	session     *C.OrtSession
	memoryInfo  *C.OrtMemoryInfo

	cStrings map[string]*C.char

	tok *tokenizer
}

// NewTurnDetector loads the ONNX model and tokenizer, initializes the
// inference session, and returns a ready TurnDetector.
func NewTurnDetector(cfg TurnDetectorConfig) (*TurnDetector, error) {
	modelPath := resolveModelPath(cfg.ModelPath)
	tokenizerPath := resolveTokenizerPath(cfg.TokenizerPath)

	tok, err := newTokenizer(tokenizerPath)
	if err != nil {
		return nil, fmt.Errorf("turn_detector: load tokenizer: %w", err)
	}

	td := &TurnDetector{
		cStrings: map[string]*C.char{},
		tok:      tok,
	}

	td.api = C.LktOrtGetApi()
	if td.api == nil {
		return nil, fmt.Errorf("turn_detector: failed to get ONNX Runtime API")
	}

	td.cStrings["loggerName"] = C.CString(turnDetectorName)
	status := C.LktOrtApiCreateEnv(td.api, C.ORT_LOGGING_LEVEL_ERROR, td.cStrings["loggerName"], &td.env)
	defer C.LktOrtApiReleaseStatus(td.api, status)
	if status != nil {
		td.cleanup()
		return nil, fmt.Errorf("turn_detector: create env: %s", C.GoString(C.LktOrtApiGetErrorMessage(td.api, status)))
	}

	status = C.LktOrtApiCreateSessionOptions(td.api, &td.sessionOpts)
	defer C.LktOrtApiReleaseStatus(td.api, status)
	if status != nil {
		td.cleanup()
		return nil, fmt.Errorf("turn_detector: create session options: %s", C.GoString(C.LktOrtApiGetErrorMessage(td.api, status)))
	}

	status = C.LktOrtApiSetIntraOpNumThreads(td.api, td.sessionOpts, 1)
	defer C.LktOrtApiReleaseStatus(td.api, status)
	if status != nil {
		td.cleanup()
		return nil, fmt.Errorf("turn_detector: set intra threads: %s", C.GoString(C.LktOrtApiGetErrorMessage(td.api, status)))
	}

	status = C.LktOrtApiSetInterOpNumThreads(td.api, td.sessionOpts, 1)
	defer C.LktOrtApiReleaseStatus(td.api, status)
	if status != nil {
		td.cleanup()
		return nil, fmt.Errorf("turn_detector: set inter threads: %s", C.GoString(C.LktOrtApiGetErrorMessage(td.api, status)))
	}

	status = C.LktOrtApiSetSessionGraphOptimizationLevel(td.api, td.sessionOpts, C.ORT_ENABLE_ALL)
	defer C.LktOrtApiReleaseStatus(td.api, status)
	if status != nil {
		td.cleanup()
		return nil, fmt.Errorf("turn_detector: set optimization: %s", C.GoString(C.LktOrtApiGetErrorMessage(td.api, status)))
	}

	td.cStrings["modelPath"] = C.CString(modelPath)
	status = C.LktOrtApiCreateSession(td.api, td.env, td.cStrings["modelPath"], td.sessionOpts, &td.session)
	defer C.LktOrtApiReleaseStatus(td.api, status)
	if status != nil {
		td.cleanup()
		return nil, fmt.Errorf("turn_detector: create session: %s", C.GoString(C.LktOrtApiGetErrorMessage(td.api, status)))
	}

	status = C.LktOrtApiCreateCpuMemoryInfo(td.api, C.OrtArenaAllocator, C.OrtMemTypeDefault, &td.memoryInfo)
	defer C.LktOrtApiReleaseStatus(td.api, status)
	if status != nil {
		td.cleanup()
		return nil, fmt.Errorf("turn_detector: create memory info: %s", C.GoString(C.LktOrtApiGetErrorMessage(td.api, status)))
	}

	td.cStrings["input_ids"] = C.CString("input_ids")
	td.cStrings["attention_mask"] = C.CString("attention_mask")
	td.cStrings["logits"] = C.CString("logits")

	return td, nil
}

// Predict runs inference on the given text (already formatted via chat template)
// and returns the probability that the user has finished their turn (P(im_end)).
//
// The text should be pre-formatted using formatChatTemplate with the last user
// message left open (no closing <|im_end|>).
func (td *TurnDetector) Predict(text string) (float64, error) {
	if td == nil {
		return 0, fmt.Errorf("turn_detector: nil detector")
	}

	tokenIDs := td.tok.Encode(text)
	if len(tokenIDs) == 0 {
		return 0, fmt.Errorf("turn_detector: empty token sequence")
	}

	// Convert to int64 slices for ONNX
	inputIDs := make([]int64, len(tokenIDs))
	attentionMask := make([]int64, len(tokenIDs))
	for i, id := range tokenIDs {
		inputIDs[i] = int64(id)
		attentionMask[i] = 1
	}

	logits, err := td.infer(inputIDs, attentionMask)
	if err != nil {
		return 0, err
	}

	// Extract logits for the last token position
	seqLen := len(tokenIDs)
	lastTokenLogits := logits[(seqLen-1)*vocabSize : seqLen*vocabSize]

	// Softmax over the last token's logits and extract P(im_end)
	prob := softmaxAt(lastTokenLogits, imEndTokenID)
	return prob, nil
}

// softmaxAt computes the softmax probability at a specific index.
// Uses the log-sum-exp trick for numerical stability.
func softmaxAt(logits []float32, idx int) float64 {
	if idx >= len(logits) {
		return 0
	}

	// Find max for numerical stability
	maxVal := float64(logits[0])
	for _, v := range logits[1:] {
		if float64(v) > maxVal {
			maxVal = float64(v)
		}
	}

	// Compute sum of exp(x - max)
	sumExp := 0.0
	for _, v := range logits {
		sumExp += math.Exp(float64(v) - maxVal)
	}

	return math.Exp(float64(logits[idx])-maxVal) / sumExp
}

// Destroy releases all ONNX Runtime resources.
func (td *TurnDetector) Destroy() {
	if td == nil {
		return
	}
	td.cleanup()
}

// cleanup releases ONNX Runtime handles in reverse allocation order.
func (td *TurnDetector) cleanup() {
	if td.memoryInfo != nil {
		C.LktOrtApiReleaseMemoryInfo(td.api, td.memoryInfo)
		td.memoryInfo = nil
	}
	if td.session != nil {
		C.LktOrtApiReleaseSession(td.api, td.session)
		td.session = nil
	}
	if td.sessionOpts != nil {
		C.LktOrtApiReleaseSessionOptions(td.api, td.sessionOpts)
		td.sessionOpts = nil
	}
	if td.env != nil {
		C.LktOrtApiReleaseEnv(td.api, td.env)
		td.env = nil
	}
	for k, ptr := range td.cStrings {
		C.free(unsafe.Pointer(ptr))
		delete(td.cStrings, k)
	}
}

func resolveModelPath(configured string) string {
	if configured != "" {
		return configured
	}
	if envPath := os.Getenv(envModelPathKey); envPath != "" {
		return envPath
	}
	_, currentFile, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(currentFile), defaultModelFile)
}

func resolveTokenizerPath(configured string) string {
	if configured != "" {
		return configured
	}
	if envPath := os.Getenv(envTokenizerPathKey); envPath != "" {
		return envPath
	}
	_, currentFile, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(currentFile), defaultTokenizerFile)
}
