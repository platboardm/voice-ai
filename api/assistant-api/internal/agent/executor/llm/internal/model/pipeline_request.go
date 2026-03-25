// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.
package internal_model

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	internal_type "github.com/rapidaai/api/assistant-api/internal/type"
	type_enums "github.com/rapidaai/pkg/types/enums"
	"github.com/rapidaai/pkg/utils"
	"github.com/rapidaai/protos"
)

// Pipeline is the central recursive router. Packets enter and get transformed
// into pipeline types; pipeline types get their stages executed.
func (e *modelAssistantExecutor) Pipeline(ctx context.Context, communication internal_type.Communication, v Pipeline) error {
	switch p := v.(type) {
	case *LocalHistoryPipeline:
		if p.Message == nil {
			return nil
		}
		e.mu.Lock()
		e.history = append(e.history, p.Message)
		e.mu.Unlock()
		return nil
	case *PrepareHistoryPipeline:
		e.mu.RLock()
		history := make([]*protos.Message, len(e.history))
		copy(history, e.history)
		e.mu.RUnlock()
		return e.Pipeline(ctx, communication, &AssistantArgumentationPipeline{
			InputPipeline: InputPipeline{
				Packet: p.Packet,
			},
			UserMessage: &protos.Message{
				Role: "user",
				Message: &protos.Message_User{
					User: &protos.UserMessage{Content: p.Packet.Text},
				},
			},
			History:    history,
			PromptArgs: map[string]interface{}{},
		})
	case *ArgumentationPipeline:
		return e.Pipeline(ctx, communication, &AssistantArgumentationPipeline{
			InputPipeline: p.InputPipeline,
			UserMessage:   p.UserMessage,
			History:       p.History,
			PromptArgs:    p.PromptArgs,
		})
	case *AssistantArgumentationPipeline:
		return e.Pipeline(ctx, communication, &ConversationArgumentationPipeline{
			InputPipeline: p.InputPipeline,
			UserMessage:   p.UserMessage,
			History:       p.History,
			PromptArgs:    utils.MergeMaps(p.PromptArgs, e.buildAssistantArgumentationContext(communication)),
		})
	case *ConversationArgumentationPipeline:
		return e.Pipeline(ctx, communication, &MessageArgumentationPipeline{
			InputPipeline: p.InputPipeline,
			UserMessage:   p.UserMessage,
			History:       p.History,
			PromptArgs:    utils.MergeMaps(p.PromptArgs, e.buildConversationArgumentationContext(communication)),
		})
	case *MessageArgumentationPipeline:
		return e.Pipeline(ctx, communication, &SessionArgumentationPipeline{
			InputPipeline: p.InputPipeline,
			UserMessage:   p.UserMessage,
			History:       p.History,
			PromptArgs:    utils.MergeMaps(p.PromptArgs, e.buildMessageArgumentationContext(p.Packet)),
		})
	case *SessionArgumentationPipeline:
		promptArgs := utils.MergeMaps(p.PromptArgs, e.buildSessionArgumentationContext(communication))
		if p.Mode == "tool_followup" {
			return e.Pipeline(ctx, communication, &ToolFollowUpExecutePipeline{
				InputPipeline: p.InputPipeline,
				History:       p.History,
				PromptArgs:    promptArgs,
			})
		}
		return e.Pipeline(ctx, communication, &LLMRequestEventPipeline{
			InputPipeline: p.InputPipeline,
			UserMessage:   p.UserMessage,
			History:       p.History,
			PromptArgs:    promptArgs,
		})
	case *LLMRequestEventPipeline:
		communication.OnPacket(ctx, internal_type.ConversationEventPacket{
			ContextID: p.Packet.ContextID,
			Name:      "llm",
			Data: map[string]string{
				"type":             "executing",
				"script":           p.Packet.Text,
				"input_char_count": fmt.Sprintf("%d", len(p.Packet.Text)),
				"history_count":    fmt.Sprintf("%d", len(p.History)),
			},
			Time: time.Now(),
		})
		if err := e.chat(ctx, communication, p.Packet, p.PromptArgs, p.UserMessage, p.History...); err != nil {
			return err
		}
		return e.Pipeline(ctx, communication, &LocalHistoryPipeline{
			Message: p.UserMessage,
		})
	case *ToolFollowUpExecutePipeline:
		return e.chatWithHistory(ctx, communication, p.Packet.ContextID, p.PromptArgs)
	case *LLMResponsePipeline:
		if err := e.stageValidateResponse(ctx, communication, p); err != nil {
			return err
		}
		if err := e.stageBuildResponseView(ctx, communication, p); err != nil {
			return err
		}
		if err := e.stageEmitResponseUpstream(ctx, communication, p); err != nil {
			return err
		}
		if err := e.stageToolFollowUpResponse(ctx, communication, p); err != nil {
			return err
		}
		return nil
	default:
		return fmt.Errorf("unsupported pipeline type: %T", v)
	}
}

func (e *modelAssistantExecutor) clonePromptArguments(in map[string]interface{}) map[string]interface{} {
	out := make(map[string]interface{}, len(in))
	for k, v := range in {
		if nested, ok := v.(map[string]interface{}); ok {
			out[k] = e.clonePromptArguments(nested)
			continue
		}
		out[k] = v
	}
	return out
}

func (e *modelAssistantExecutor) buildAssistantArgumentationContext(communication internal_type.Communication) map[string]interface{} {
	now := time.Now().UTC()
	system := map[string]interface{}{
		"current_date":     now.Format("2006-01-02"),
		"current_time":     now.Format("15:04:05"),
		"current_datetime": now.Format(time.RFC3339),
		"day_of_week":      now.Weekday().String(),
		"date_rfc1123":     now.Format(time.RFC1123),
		"date_unix":        strconv.FormatInt(now.Unix(), 10),
		"date_unix_ms":     strconv.FormatInt(now.UnixMilli(), 10),
	}

	assistant := map[string]interface{}{}
	if a := communication.Assistant(); a != nil {
		assistant = map[string]interface{}{
			"name":        a.Name,
			"id":          fmt.Sprintf("%d", a.Id),
			"language":    a.Language,
			"description": a.Description,
		}
	}

	args := communication.GetArgs()
	return utils.MergeMaps(
		map[string]interface{}{"system": system},
		map[string]interface{}{"assistant": assistant},
		map[string]interface{}{"message": map[string]interface{}{"language": "English"}},
		map[string]interface{}{"args": args},
		args,
	)
}

func (e *modelAssistantExecutor) buildConversationArgumentationContext(communication internal_type.Communication) map[string]interface{} {
	conversation := map[string]interface{}{}
	if conv := communication.Conversation(); conv != nil {
		conversation["id"] = fmt.Sprintf("%d", conv.Id)
		conversation["identifier"] = conv.Identifier
		conversation["source"] = string(conv.Source)
		conversation["direction"] = conv.Direction.String()
		if startTime := time.Time(conv.CreatedDate); !startTime.IsZero() {
			conversation["created_date"] = startTime.UTC().Format(time.RFC3339)
			conversation["duration"] = time.Since(startTime).Truncate(time.Second).String()
		}
		if updated := time.Time(conv.UpdatedDate); !updated.IsZero() {
			conversation["updated_date"] = updated.UTC().Format(time.RFC3339)
		}
	}
	return map[string]interface{}{"conversation": conversation}
}

func (e *modelAssistantExecutor) buildMessageArgumentationContext(packet internal_type.UserTextPacket) map[string]interface{} {
	message := map[string]interface{}{
		"text": "",
	}
	if packet.Language != "" {
		message["language"] = packet.Language
	}
	message["text"] = packet.Text
	return map[string]interface{}{"message": message}
}

type modeCommunication interface {
	GetMode() type_enums.MessageMode
}

func (e *modelAssistantExecutor) buildSessionArgumentationContext(communication internal_type.Communication) map[string]interface{} {
	session := map[string]interface{}{}
	if modeComm, ok := communication.(modeCommunication); ok {
		if mode := modeComm.GetMode(); mode != "" {
			session["mode"] = mode.String()
		}
	}
	return map[string]interface{}{"session": session}
}

// validateHistorySequence enforces tool-call sequencing invariants:
//  1. Sandwich rule: assistant(tool_call) must be immediately followed by tool.
//  2. ID matching: tool message IDs must exactly match preceding tool_call IDs.
//  3. No orphans: tool without matching preceding assistant(tool_call) is invalid.
//  4. Strict sequencing: after tool response, next message (if any) must be assistant.
func (e *modelAssistantExecutor) validateHistorySequence(messages []*protos.Message) error {
	for i, msg := range messages {
		assistant := msg.GetAssistant()
		tool := msg.GetTool()

		if assistant != nil && len(assistant.GetToolCalls()) > 0 {
			if i+1 >= len(messages) || messages[i+1].GetTool() == nil {
				return fmt.Errorf("history invalid: assistant tool_call at index %d is not immediately followed by tool response", i)
			}
			if err := e.validateToolIDMatch(assistant.GetToolCalls(), messages[i+1].GetTool().GetTools(), i); err != nil {
				return err
			}
		}

		if tool != nil {
			if i == 0 {
				return fmt.Errorf("history invalid: orphan tool response at index %d without preceding assistant tool_call", i)
			}
			prevAssistant := messages[i-1].GetAssistant()
			if prevAssistant == nil || len(prevAssistant.GetToolCalls()) == 0 {
				return fmt.Errorf("history invalid: orphan tool response at index %d without preceding assistant tool_call", i)
			}
			if err := e.validateToolIDMatch(prevAssistant.GetToolCalls(), tool.GetTools(), i-1); err != nil {
				return err
			}
			if i+1 < len(messages) && messages[i+1].GetAssistant() == nil {
				return fmt.Errorf("history invalid: strict sequencing violated at index %d, expected assistant after tool response", i)
			}
		}
	}
	return nil
}

func (e *modelAssistantExecutor) validateToolIDMatch(calls []*protos.ToolCall, tools []*protos.ToolMessage_Tool, assistantIdx int) error {
	expected := map[string]struct{}{}
	for _, c := range calls {
		if id := strings.TrimSpace(c.GetId()); id != "" {
			expected[id] = struct{}{}
		}
	}
	actual := map[string]struct{}{}
	for _, t := range tools {
		if id := strings.TrimSpace(t.GetId()); id != "" {
			actual[id] = struct{}{}
		}
	}

	for id := range expected {
		if _, ok := actual[id]; !ok {
			return fmt.Errorf("history invalid: missing tool response for tool_call_id %q from assistant index %d", id, assistantIdx)
		}
	}
	for id := range actual {
		if _, ok := expected[id]; !ok {
			return fmt.Errorf("history invalid: orphan tool response id %q at assistant index %d", id, assistantIdx)
		}
	}
	return nil
}

// buildChatRequest constructs the chat request with all necessary parameters.
// The caller provides the complete conversation messages (system prompt is prepended automatically).
func (e *modelAssistantExecutor) buildChatRequest(communication internal_type.Communication, contextID string, promptArguments map[string]interface{}, messages ...*protos.Message) *protos.ChatRequest {
	assistant := communication.Assistant()
	template := assistant.AssistantProviderModel.Template.GetTextChatCompleteTemplate()
	systemMessages := e.inputBuilder.Message(
		template.Prompt,
		utils.MergeMaps(e.inputBuilder.PromptArguments(template.Variables), promptArguments),
	)
	req := e.inputBuilder.Chat(
		contextID,
		&protos.Credential{
			Id:    e.providerCredential.GetId(),
			Value: e.providerCredential.GetValue(),
		},
		e.inputBuilder.Options(utils.MergeMaps(assistant.AssistantProviderModel.GetOptions(), communication.GetOptions()), nil),
		e.toolExecutor.GetFunctionDefinitions(),
		map[string]string{
			"assistant_id":                fmt.Sprintf("%d", assistant.Id),
			"message_id":                  contextID,
			"assistant_provider_model_id": fmt.Sprintf("%d", assistant.AssistantProviderModel.Id),
		},
		append(systemMessages, messages...)...,
	)
	req.ProviderName = strings.ToLower(assistant.AssistantProviderModel.ModelProviderName)
	return req
}
