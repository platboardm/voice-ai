// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package internal_transformer_speechmatics

import (
	"fmt"

	"github.com/rapidaai/pkg/commons"
	"github.com/rapidaai/pkg/utils"
	"github.com/rapidaai/protos"
)

const (
	SPEECHMATICS_STT_URL       = "wss://eu2.rt.speechmatics.com/v2"
	SPEECHMATICS_TTS_URL       = "https://mp.speechmatics.com/v1/api/generate"
	SPEECHMATICS_DEFAULT_LANG  = "en"
	SPEECHMATICS_DEFAULT_VOICE = "en-US-1"
)

type speechmaticsOption struct {
	key     string
	logger  commons.Logger
	mdlOpts utils.Option
}

func NewSpeechmaticsOption(logger commons.Logger, vaultCredential *protos.VaultCredential,
	opts utils.Option) (*speechmaticsOption, error) {
	cx, ok := vaultCredential.GetValue().AsMap()["key"]
	if !ok {
		return nil, fmt.Errorf("speechmatics: illegal vault config")
	}
	return &speechmaticsOption{
		key:     cx.(string),
		mdlOpts: opts,
		logger:  logger,
	}, nil
}

func (co *speechmaticsOption) GetKey() string {
	return co.key
}

func (co *speechmaticsOption) GetLanguage() string {
	if lang, err := co.mdlOpts.GetString("listen.language"); err == nil && lang != "" {
		return lang
	}
	if lang, err := co.mdlOpts.GetString("speak.language"); err == nil && lang != "" {
		return lang
	}
	return SPEECHMATICS_DEFAULT_LANG
}

func (co *speechmaticsOption) GetVoice() string {
	if voice, err := co.mdlOpts.GetString("speak.voice.id"); err == nil && voice != "" {
		return voice
	}
	return SPEECHMATICS_DEFAULT_VOICE
}
