// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package internal_transformer_resembleai

import (
	"fmt"

	"github.com/rapidaai/pkg/commons"
	"github.com/rapidaai/pkg/utils"
	"github.com/rapidaai/protos"
)

const (
	RESEMBLEAI_DEFAULT_VOICE = ""
	RESEMBLEAI_WS_URL        = "wss://websocket.cluster.resemble.ai/stream"
)

type resembleaiOption struct {
	key     string
	logger  commons.Logger
	mdlOpts utils.Option
}

func NewResembleAIOption(logger commons.Logger, vaultCredential *protos.VaultCredential,
	opts utils.Option) (*resembleaiOption, error) {
	cx, ok := vaultCredential.GetValue().AsMap()["key"]
	if !ok {
		return nil, fmt.Errorf("resembleai: illegal vault config")
	}
	return &resembleaiOption{
		key:     cx.(string),
		mdlOpts: opts,
		logger:  logger,
	}, nil
}

func (co *resembleaiOption) GetKey() string {
	return co.key
}

func (co *resembleaiOption) GetVoiceUUID() string {
	if voiceID, err := co.mdlOpts.GetString("speak.voice.id"); err == nil && voiceID != "" {
		return voiceID
	}
	return RESEMBLEAI_DEFAULT_VOICE
}

func (co *resembleaiOption) GetSampleRate() int {
	return 16000
}
