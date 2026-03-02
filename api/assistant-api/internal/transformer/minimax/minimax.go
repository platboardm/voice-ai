// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package internal_transformer_minimax

import (
	"fmt"

	"github.com/rapidaai/pkg/commons"
	"github.com/rapidaai/pkg/utils"
	"github.com/rapidaai/protos"
)

const (
	MINIMAX_DEFAULT_MODEL = "speech-02-turbo"
	MINIMAX_DEFAULT_VOICE = "male-qn-qingse"
)

type minimaxOption struct {
	key     string
	groupId string
	logger  commons.Logger
	mdlOpts utils.Option
}

func NewMiniMaxOption(logger commons.Logger, vaultCredential *protos.VaultCredential,
	opts utils.Option) (*minimaxOption, error) {
	vaultMap := vaultCredential.GetValue().AsMap()
	cx, ok := vaultMap["key"]
	if !ok {
		return nil, fmt.Errorf("minimax: illegal vault config - missing key")
	}
	gid, ok := vaultMap["group_id"]
	if !ok {
		return nil, fmt.Errorf("minimax: illegal vault config - missing group_id")
	}
	return &minimaxOption{
		key:     cx.(string),
		groupId: gid.(string),
		mdlOpts: opts,
		logger:  logger,
	}, nil
}

func (co *minimaxOption) GetKey() string {
	return co.key
}

func (co *minimaxOption) GetGroupId() string {
	return co.groupId
}

func (co *minimaxOption) GetModel() string {
	if model, err := co.mdlOpts.GetString("speak.model"); err == nil && model != "" {
		return model
	}
	return MINIMAX_DEFAULT_MODEL
}

func (co *minimaxOption) GetVoice() string {
	if voiceID, err := co.mdlOpts.GetString("speak.voice.id"); err == nil && voiceID != "" {
		return voiceID
	}
	return MINIMAX_DEFAULT_VOICE
}

func (co *minimaxOption) GetAPIURL() string {
	return fmt.Sprintf("https://api.minimax.io/v1/t2a_v2?GroupId=%s", co.groupId)
}
