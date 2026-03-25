// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.
package internal_model

import (
	"time"

	internal_type "github.com/rapidaai/api/assistant-api/internal/type"
	"github.com/rapidaai/protos"
)

type Pipeline interface {
	IsStop() bool
}

type InputPipeline struct {
	Pipeline
	Stop   bool
	Packet internal_type.UserTextPacket
	Mode   string
}

func (p InputPipeline) IsStop() bool {
	return p.Stop
}

// PrepareHistoryPipeline builds the user message and prepares validated history.
type PrepareHistoryPipeline struct {
	InputPipeline
	UserMessage *protos.Message
	History     []*protos.Message
}

type ArgumentationPipeline struct {
	InputPipeline
	UserMessage *protos.Message
	History     []*protos.Message
	PromptArgs  map[string]interface{}
}

type AssistantArgumentationPipeline struct {
	InputPipeline
	UserMessage *protos.Message
	History     []*protos.Message
	PromptArgs  map[string]interface{}
}

type ConversationArgumentationPipeline struct {
	InputPipeline
	UserMessage *protos.Message
	History     []*protos.Message
	PromptArgs  map[string]interface{}
}

type MessageArgumentationPipeline struct {
	InputPipeline
	UserMessage *protos.Message
	History     []*protos.Message
	PromptArgs  map[string]interface{}
}

type SessionArgumentationPipeline struct {
	InputPipeline
	UserMessage *protos.Message
	History     []*protos.Message
	PromptArgs  map[string]interface{}
}

type LLMRequestEventPipeline struct {
	InputPipeline
	UserMessage *protos.Message
	History     []*protos.Message
	PromptArgs  map[string]interface{}
}

type ToolFollowUpExecutePipeline struct {
	InputPipeline
	History    []*protos.Message
	PromptArgs map[string]interface{}
}

// LocalHistoryPipeline appends a message to local in-memory history.
type LocalHistoryPipeline struct {
	Pipeline
	Stop    bool
	Message *protos.Message
}

func (p LocalHistoryPipeline) IsStop() bool {
	return p.Stop
}

// LLMResponsePipeline is the typed response state flowing through stages.
type LLMResponsePipeline struct {
	Pipeline
	Stop         bool
	Response     *protos.ChatResponse
	ContextID    string
	Output       *protos.Message
	Metrics      []*protos.Metric
	HasToolCalls bool
	ResponseText string
	Now          time.Time
}

func (p LLMResponsePipeline) IsStop() bool {
	return p.Stop
}
