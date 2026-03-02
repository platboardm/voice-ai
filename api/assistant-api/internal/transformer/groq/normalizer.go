// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package internal_transformer_groq

import (
	"context"
	"regexp"
	"strings"

	internal_normalizers "github.com/rapidaai/api/assistant-api/internal/normalizers"
	internal_type "github.com/rapidaai/api/assistant-api/internal/type"
	"github.com/rapidaai/pkg/commons"
	"github.com/rapidaai/pkg/utils"
)

type groqNormalizer struct {
	logger      commons.Logger
	config      internal_type.NormalizerConfig
	normalizers []internal_normalizers.Normalizer
}

func NewGroqNormalizer(logger commons.Logger, opts utils.Option) internal_type.TextNormalizer {
	cfg := internal_type.DefaultNormalizerConfig()

	var normalizers []internal_normalizers.Normalizer
	if dictionaries, err := opts.GetString("speaker.pronunciation.dictionaries"); err == nil && dictionaries != "" {
		normalizerNames := strings.Split(dictionaries, commons.SEPARATOR)
		normalizers = internal_type.BuildNormalizerPipeline(logger, normalizerNames)
	}

	return &groqNormalizer{
		logger:      logger,
		config:      cfg,
		normalizers: normalizers,
	}
}

func (n *groqNormalizer) Normalize(ctx context.Context, text string) string {
	if text == "" {
		return text
	}

	text = n.removeMarkdown(text)

	for _, normalizer := range n.normalizers {
		text = normalizer.Normalize(text)
	}

	return n.normalizeWhitespace(text)
}

func (n *groqNormalizer) removeMarkdown(input string) string {
	re := regexp.MustCompile(`(?m)^#{1,6}\s*`)
	output := re.ReplaceAllString(input, "")

	re = regexp.MustCompile(`\*{1,2}([^*]+?)\*{1,2}|_{1,2}([^_]+?)_{1,2}`)
	output = re.ReplaceAllString(output, "$1$2")

	re = regexp.MustCompile("`([^`]+)`")
	output = re.ReplaceAllString(output, "$1")

	re = regexp.MustCompile("(?s)```[^`]*```")
	output = re.ReplaceAllString(output, "")

	re = regexp.MustCompile(`(?m)^>\s?`)
	output = re.ReplaceAllString(output, "")

	re = regexp.MustCompile(`\[(.*?)\]\(.*?\)`)
	output = re.ReplaceAllString(output, "$1")

	re = regexp.MustCompile(`!\[(.*?)\]\(.*?\)`)
	output = re.ReplaceAllString(output, "$1")

	re = regexp.MustCompile(`(?m)^(-{3,}|\*{3,}|_{3,})$`)
	output = re.ReplaceAllString(output, "")

	re = regexp.MustCompile(`[*_]+`)
	output = re.ReplaceAllString(output, "")

	return output
}

func (n *groqNormalizer) normalizeWhitespace(text string) string {
	re := regexp.MustCompile(`\s+`)
	result := re.ReplaceAllString(text, " ")
	return strings.TrimSpace(result)
}
