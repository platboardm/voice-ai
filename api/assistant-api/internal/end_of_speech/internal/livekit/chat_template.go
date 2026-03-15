// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.
package internal_livekit

import (
	"strings"
)

// chatMessage represents a single message in the conversation for templating.
type chatMessage struct {
	Role    string
	Content string
}

// formatChatTemplateFromHistory formats internal conversation history into the
// SmolLM2 chat template.
//
// Template format:
//
//	<|im_start|>role
//	content<|im_end|>
//
// The last user message (currentText) is left open (no <|im_end|>) so the
// model can predict whether the user has finished their turn.
func formatChatTemplateFromHistory(history []chatMessage, currentText string, maxTurns int) string {
	// Collect recent history turns
	start := 0
	if maxTurns > 0 && len(history) > maxTurns {
		start = len(history) - maxTurns
	}
	recent := history[start:]

	// Build messages: recent history + current user text
	messages := make([]chatMessage, 0, len(recent)+1)
	for _, msg := range recent {
		if msg.Role == "" || msg.Content == "" {
			continue
		}
		messages = append(messages, msg)
	}
	if currentText != "" {
		messages = append(messages, chatMessage{Role: "user", Content: currentText})
	}

	if len(messages) == 0 {
		return ""
	}

	var b strings.Builder
	b.Grow(256)

	for i, msg := range messages {
		isLast := i == len(messages)-1
		b.WriteString("<|im_start|>")
		b.WriteString(msg.Role)
		b.WriteByte('\n')
		b.WriteString(msg.Content)
		if !isLast {
			b.WriteString("<|im_end|>")
			b.WriteByte('\n')
		}
		// Last message is left open — no <|im_end|>
	}

	return b.String()
}
