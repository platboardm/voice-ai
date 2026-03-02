// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

package minimax_internal

type MiniMaxTextToSpeechSSEResponse struct {
	Data MiniMaxTTSData `json:"data"`
}

type MiniMaxTTSData struct {
	Audio  string `json:"audio"`
	Status int    `json:"status"`
}
