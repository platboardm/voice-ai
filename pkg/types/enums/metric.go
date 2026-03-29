// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.
package type_enums

type MetricName string

var (
	TIME_TAKEN   MetricName = "time_taken"
	STATUS       MetricName = "status"
	INPUT_TOKEN  MetricName = "input_token"
	OUTPUT_TOKEN MetricName = "output_token"
	TOTAL_TOKEN  MetricName = "total_token"
	COST         MetricName = "cost"
	INPUT_COST   MetricName = "input_cost"
	OUTPUT_COST  MetricName = "output_cost"
	//
	LLM_REQUEST_ID MetricName = "llm_request_id"
	//
	TOKEN_PRE_SECOND       MetricName = "token_pre_second"
	TIME_TO_FIRST_TOKEN    MetricName = "time_to_first_token"
	PROVIDER_TOTAL_TIME    MetricName = "provider_total_time"
	PROVIDER_GENERATE_TIME MetricName = "provider_generate_time"
)

func (m *MetricName) String() string {
	return string(*m)
}
