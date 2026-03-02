// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package nvidia_internal

// NvidiaSTTResult represents a speech recognition result from NVIDIA Riva.
type NvidiaSTTResult struct {
	Alternatives []NvidiaSTTAlternative `json:"alternatives"`
	IsFinal      bool                   `json:"is_final"`
}

type NvidiaSTTAlternative struct {
	Transcript string  `json:"transcript"`
	Confidence float64 `json:"confidence"`
}
