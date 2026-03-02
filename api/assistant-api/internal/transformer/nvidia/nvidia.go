// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package internal_transformer_nvidia

import (
	"fmt"

	"github.com/rapidaai/pkg/commons"
	"github.com/rapidaai/pkg/utils"
	"github.com/rapidaai/protos"
)

const (
	NVIDIA_GRPC_ENDPOINT    = "grpc.nvcf.nvidia.com:443"
	NVIDIA_DEFAULT_LANGUAGE = "en-US"
	NVIDIA_DEFAULT_VOICE    = "English-US.Female-1"
)

type nvidiaOption struct {
	key        string
	functionId string
	logger     commons.Logger
	mdlOpts    utils.Option
}

func NewNvidiaOption(logger commons.Logger, vaultCredential *protos.VaultCredential,
	opts utils.Option) (*nvidiaOption, error) {
	vaultMap := vaultCredential.GetValue().AsMap()
	cx, ok := vaultMap["key"]
	if !ok {
		return nil, fmt.Errorf("nvidia: illegal vault config - missing key")
	}
	fid, ok := vaultMap["function_id"]
	if !ok {
		return nil, fmt.Errorf("nvidia: illegal vault config - missing function_id")
	}
	return &nvidiaOption{
		key:        cx.(string),
		functionId: fid.(string),
		mdlOpts:    opts,
		logger:     logger,
	}, nil
}

func (co *nvidiaOption) GetKey() string {
	return co.key
}

func (co *nvidiaOption) GetFunctionId() string {
	return co.functionId
}

func (co *nvidiaOption) GetLanguage() string {
	if lang, err := co.mdlOpts.GetString("listen.language"); err == nil && lang != "" {
		return lang
	}
	if lang, err := co.mdlOpts.GetString("speak.language"); err == nil && lang != "" {
		return lang
	}
	return NVIDIA_DEFAULT_LANGUAGE
}

func (co *nvidiaOption) GetVoice() string {
	if voice, err := co.mdlOpts.GetString("speak.voice.id"); err == nil && voice != "" {
		return voice
	}
	return NVIDIA_DEFAULT_VOICE
}

func (co *nvidiaOption) GetSTTModel() string {
	if model, err := co.mdlOpts.GetString("listen.model"); err == nil && model != "" {
		return model
	}
	return ""
}

func (co *nvidiaOption) GetTTSModel() string {
	if model, err := co.mdlOpts.GetString("speak.model"); err == nil && model != "" {
		return model
	}
	return ""
}
