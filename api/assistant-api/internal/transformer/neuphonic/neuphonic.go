// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package internal_transformer_neuphonic

import (
	"fmt"
	"net/url"

	"github.com/rapidaai/pkg/commons"
	"github.com/rapidaai/pkg/utils"
	"github.com/rapidaai/protos"
)

const (
	NEUPHONIC_DEFAULT_VOICE = ""
	NEUPHONIC_DEFAULT_LANG  = "en"
	NEUPHONIC_DEFAULT_SPEED = "1.0"
)

type neuphonicOption struct {
	key     string
	logger  commons.Logger
	mdlOpts utils.Option
}

func NewNeuPhonicOption(logger commons.Logger, vaultCredential *protos.VaultCredential,
	opts utils.Option) (*neuphonicOption, error) {
	cx, ok := vaultCredential.GetValue().AsMap()["key"]
	if !ok {
		return nil, fmt.Errorf("neuphonic: illegal vault config")
	}
	return &neuphonicOption{
		key:     cx.(string),
		mdlOpts: opts,
		logger:  logger,
	}, nil
}

func (co *neuphonicOption) GetKey() string {
	return co.key
}

func (co *neuphonicOption) GetTextToSpeechConnectionString() string {
	lang := NEUPHONIC_DEFAULT_LANG
	if langValue, err := co.mdlOpts.GetString("speak.language"); err == nil && langValue != "" {
		lang = langValue
	}

	voice := NEUPHONIC_DEFAULT_VOICE
	if voiceID, err := co.mdlOpts.GetString("speak.voice.id"); err == nil && voiceID != "" {
		voice = voiceID
	}

	speed := NEUPHONIC_DEFAULT_SPEED
	if speedValue, err := co.mdlOpts.GetString("speak.speed"); err == nil && speedValue != "" {
		speed = speedValue
	}

	params := url.Values{}
	params.Add("encoding", "pcm_linear")
	params.Add("sampling_rate", "16000")
	if voice != "" {
		params.Add("voice_id", voice)
	}
	params.Add("speed", speed)

	return fmt.Sprintf("wss://api.neuphonic.com/speak/%s?%s", lang, params.Encode())
}
