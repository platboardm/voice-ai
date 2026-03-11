// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package internal_transformer_groq

import (
	"fmt"

	"github.com/rapidaai/pkg/commons"
	"github.com/rapidaai/pkg/utils"
	"github.com/rapidaai/protos"
)

const (
	GROQ_STT_URL           = "https://api.groq.com/openai/v1/audio/transcriptions"
	GROQ_TTS_URL           = "https://api.groq.com/openai/v1/audio/speech"
	GROQ_DEFAULT_STT_MODEL = "whisper-large-v3-turbo"
	GROQ_DEFAULT_TTS_MODEL = "playai-tts"
	GROQ_DEFAULT_VOICE     = "Arista-PlayAI"
	GROQ_DEFAULT_LANGUAGE  = "en"
)

type groqOption struct {
	key     string
	logger  commons.Logger
	mdlOpts utils.Option
}

func NewGroqOption(logger commons.Logger, vaultCredential *protos.VaultCredential,
	opts utils.Option) (*groqOption, error) {
	cx, ok := vaultCredential.GetValue().AsMap()["key"]
	if !ok {
		return nil, fmt.Errorf("groq: illegal vault config")
	}
	return &groqOption{
		key:     cx.(string),
		mdlOpts: opts,
		logger:  logger,
	}, nil
}

func (co *groqOption) GetKey() string {
	return co.key
}

func (co *groqOption) GetSTTModel() string {
	if model, err := co.mdlOpts.GetString("listen.model"); err == nil && model != "" {
		return model
	}
	return GROQ_DEFAULT_STT_MODEL
}

func (co *groqOption) GetTTSModel() string {
	if model, err := co.mdlOpts.GetString("speak.model"); err == nil && model != "" {
		return model
	}
	return GROQ_DEFAULT_TTS_MODEL
}

func (co *groqOption) GetVoice() string {
	if voice, err := co.mdlOpts.GetString("speak.voice.id"); err == nil && voice != "" {
		return voice
	}
	return GROQ_DEFAULT_VOICE
}

func (co *groqOption) GetLanguage() string {
	if lang, err := co.mdlOpts.GetString("listen.language"); err == nil && lang != "" {
		return lang
	}
	return GROQ_DEFAULT_LANGUAGE
}
