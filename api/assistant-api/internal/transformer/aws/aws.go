// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package internal_transformer_aws

import (
	"fmt"

	"github.com/rapidaai/pkg/commons"
	"github.com/rapidaai/pkg/utils"
	"github.com/rapidaai/protos"
)

const (
	AWS_DEFAULT_REGION   = "us-east-1"
	AWS_DEFAULT_LANGUAGE = "en-US"
	AWS_DEFAULT_VOICE    = "Joanna"
	AWS_DEFAULT_ENGINE   = "neural"
)

type awsOption struct {
	accessKeyId     string
	secretAccessKey string
	region          string
	logger          commons.Logger
	mdlOpts         utils.Option
}

func NewAWSOption(logger commons.Logger, vaultCredential *protos.VaultCredential,
	opts utils.Option) (*awsOption, error) {
	vaultMap := vaultCredential.GetValue().AsMap()
	akid, ok := vaultMap["access_key_id"]
	if !ok {
		return nil, fmt.Errorf("aws: illegal vault config - missing access_key_id")
	}
	sak, ok := vaultMap["secret_access_key"]
	if !ok {
		return nil, fmt.Errorf("aws: illegal vault config - missing secret_access_key")
	}
	region := AWS_DEFAULT_REGION
	if r, ok := vaultMap["region"]; ok && r.(string) != "" {
		region = r.(string)
	}
	return &awsOption{
		accessKeyId:     akid.(string),
		secretAccessKey: sak.(string),
		region:          region,
		mdlOpts:         opts,
		logger:          logger,
	}, nil
}

func (co *awsOption) GetAccessKeyId() string {
	return co.accessKeyId
}

func (co *awsOption) GetSecretAccessKey() string {
	return co.secretAccessKey
}

func (co *awsOption) GetRegion() string {
	return co.region
}

func (co *awsOption) GetLanguage() string {
	if lang, err := co.mdlOpts.GetString("listen.language"); err == nil && lang != "" {
		return lang
	}
	if lang, err := co.mdlOpts.GetString("speak.language"); err == nil && lang != "" {
		return lang
	}
	return AWS_DEFAULT_LANGUAGE
}

func (co *awsOption) GetVoice() string {
	if voice, err := co.mdlOpts.GetString("speak.voice.id"); err == nil && voice != "" {
		return voice
	}
	return AWS_DEFAULT_VOICE
}

func (co *awsOption) GetEngine() string {
	if engine, err := co.mdlOpts.GetString("speak.model"); err == nil && engine != "" {
		return engine
	}
	return AWS_DEFAULT_ENGINE
}
