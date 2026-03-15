// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package internal_vad

import (
	"context"
	"testing"

	internal_type "github.com/rapidaai/api/assistant-api/internal/type"
	"github.com/rapidaai/pkg/commons"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func MockVADCallback(ctx context.Context, p ...internal_type.Packet) error {
	return nil
}

func TestGetVAD_SILERO_VAD(t *testing.T) {
	logger, _ := commons.NewApplicationLogger()

	vad, err := GetVAD(t.Context(), logger, func(ctx context.Context, p ...internal_type.Packet) error { return nil }, map[string]interface{}{
		OptionsKeyVadProvider: SILERO_VAD,
	})

	require.NoError(t, err)
	require.NotNil(t, vad)
	assert.Equal(t, "silero_vad", vad.Name())
}

func TestGetVAD_InvalidIdentifier(t *testing.T) {
	logger, _ := commons.NewApplicationLogger()

	vad, err := GetVAD(t.Context(), logger, MockVADCallback, map[string]interface{}{
		OptionsKeyVadProvider: "invalid_vad",
	})

	require.NoError(t, err, "GetVAD should default to SILERO_VAD for invalid identifier")
	require.NotNil(t, vad)
	assert.NotEmpty(t, vad.Name())
}

func TestGetVAD_WithNilCallback(t *testing.T) {
	logger, _ := commons.NewApplicationLogger()

	vad, err := GetVAD(t.Context(), logger, nil, map[string]interface{}{
		OptionsKeyVadProvider: SILERO_VAD,
	})

	if err != nil {
		t.Logf("GetVAD returned error with nil callback: %v", err)
	} else if vad != nil {
		t.Logf("GetVAD returned VAD instance with nil callback")
	}
}

func TestGetVAD_ConsistentResults(t *testing.T) {
	logger, _ := commons.NewApplicationLogger()

	vad1, err1 := GetVAD(t.Context(), logger, MockVADCallback, map[string]interface{}{
		OptionsKeyVadProvider: SILERO_VAD,
	})
	vad2, err2 := GetVAD(t.Context(), logger, MockVADCallback, map[string]interface{}{
		OptionsKeyVadProvider: SILERO_VAD,
	})

	require.NoError(t, err1)
	require.NoError(t, err2)
	require.NotNil(t, vad1)
	require.NotNil(t, vad2)
	assert.NotEmpty(t, vad1.Name())
	assert.NotEmpty(t, vad2.Name())
}

func TestGetVAD_AllIdentifiers(t *testing.T) {
	logger, _ := commons.NewApplicationLogger()

	for _, identifier := range []VADIdentifier{SILERO_VAD, TEN_VAD} {
		t.Run(string(identifier), func(t *testing.T) {
			vad, err := GetVAD(t.Context(), logger, MockVADCallback, map[string]interface{}{
				OptionsKeyVadProvider: identifier,
			})

			require.NoError(t, err, "GetVAD should not error for identifier: %s", identifier)
			require.NotNil(t, vad, "GetVAD should return VAD instance for identifier: %s", identifier)
			assert.NotEmpty(t, vad.Name())
		})
	}
}

func TestVADIdentifier_String(t *testing.T) {
	assert.Equal(t, "silero_vad", string(SILERO_VAD))
	assert.Equal(t, "ten_vad", string(TEN_VAD))
}

func BenchmarkGetVAD_SILERO_VAD(b *testing.B) {
	logger, _ := commons.NewApplicationLogger()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = GetVAD(b.Context(), logger, MockVADCallback, map[string]interface{}{
			OptionsKeyVadProvider: SILERO_VAD,
		})
	}
}

func BenchmarkGetVAD_TEN_VAD(b *testing.B) {
	logger, _ := commons.NewApplicationLogger()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = GetVAD(b.Context(), logger, MockVADCallback, map[string]interface{}{
			OptionsKeyVadProvider: TEN_VAD,
		})
	}
}
