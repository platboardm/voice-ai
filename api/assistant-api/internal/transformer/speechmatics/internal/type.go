// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package speechmatics_internal

type SpeechmaticsSTTResponse struct {
	Message  string                  `json:"message"`
	Results  []SpeechmaticsSTTResult `json:"results"`
	Metadata SpeechmaticsSTTMetadata `json:"metadata"`
}

type SpeechmaticsSTTResult struct {
	Type         string  `json:"type"`
	StartTime    float64 `json:"start_time"`
	EndTime      float64 `json:"end_time"`
	Alternatives []struct {
		Content    string  `json:"content"`
		Confidence float64 `json:"confidence"`
		Language   string  `json:"language"`
	} `json:"alternatives"`
}

type SpeechmaticsSTTMetadata struct {
	StartTime  float64 `json:"start_time"`
	EndTime    float64 `json:"end_time"`
	Transcript string  `json:"transcript"`
}
