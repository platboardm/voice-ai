// Copyright (c) 2023-2025 RapidaAI
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

#include "ort_bridge.h"

const OrtApi* LktOrtGetApi() {
  return OrtGetApiBase()->GetApi(ORT_API_VERSION);
}

const char* LktOrtApiGetErrorMessage(const OrtApi *api, OrtStatus *status) {
  return api->GetErrorMessage(status);
}

void LktOrtApiReleaseStatus(const OrtApi *api, OrtStatus *status) {
  if (status != NULL) {
    api->ReleaseStatus(status);
  }
}

OrtStatus* LktOrtApiCreateEnv(const OrtApi *api, OrtLoggingLevel log_level, const char *log_id, OrtEnv **env) {
  return api->CreateEnv(log_level, log_id, env);
}

void LktOrtApiReleaseEnv(const OrtApi *api, OrtEnv *env) {
  api->ReleaseEnv(env);
}

OrtStatus* LktOrtApiCreateSessionOptions(const OrtApi *api, OrtSessionOptions **opts) {
  return api->CreateSessionOptions(opts);
}

void LktOrtApiReleaseSessionOptions(const OrtApi *api, OrtSessionOptions *opts) {
  api->ReleaseSessionOptions(opts);
}

OrtStatus* LktOrtApiSetIntraOpNumThreads(const OrtApi *api, OrtSessionOptions *opts, int intra_op_num_threads) {
  return api->SetIntraOpNumThreads(opts, intra_op_num_threads);
}

OrtStatus* LktOrtApiSetInterOpNumThreads(const OrtApi *api, OrtSessionOptions *opts, int inter_op_num_threads) {
  return api->SetInterOpNumThreads(opts, inter_op_num_threads);
}

OrtStatus* LktOrtApiSetSessionGraphOptimizationLevel(const OrtApi *api, OrtSessionOptions *opts, GraphOptimizationLevel level) {
  return api->SetSessionGraphOptimizationLevel(opts, level);
}

OrtStatus* LktOrtApiCreateSession(const OrtApi *api, OrtEnv *env, const char *model_path, OrtSessionOptions *opts, OrtSession **session) {
  return api->CreateSession(env, model_path, opts, session);
}

void LktOrtApiReleaseSession(const OrtApi *api, OrtSession *session) {
  api->ReleaseSession(session);
}

OrtStatus* LktOrtApiCreateCpuMemoryInfo(const OrtApi *api, enum OrtAllocatorType alloc_type, enum OrtMemType mem_type, OrtMemoryInfo **minfo) {
  return api->CreateCpuMemoryInfo(alloc_type, mem_type, minfo);
}

void LktOrtApiReleaseMemoryInfo(const OrtApi *api, OrtMemoryInfo *minfo) {
  api->ReleaseMemoryInfo(minfo);
}

OrtStatus* LktOrtApiCreateTensorWithDataAsOrtValue(const OrtApi *api, const OrtMemoryInfo *minfo, void *data,
    size_t data_len, const int64_t *shape, size_t shape_len, ONNXTensorElementDataType data_type, OrtValue **value) {
  return api->CreateTensorWithDataAsOrtValue(minfo, data, data_len, shape, shape_len, data_type, value);
}

void LktOrtApiReleaseValue(const OrtApi *api, OrtValue *value) {
  api->ReleaseValue(value);
}

OrtStatus* LktOrtApiRun(const OrtApi *api, OrtSession *session, const OrtRunOptions *run_options,
    const char *const *input_names, const OrtValue *const *inputs, size_t inputs_len,
    const char *const *output_names, size_t output_names_len, OrtValue **outputs) {
  return api->Run(session, run_options, input_names, inputs, inputs_len, output_names, output_names_len, outputs);
}

OrtStatus* LktOrtApiGetTensorMutableData(const OrtApi *api, OrtValue *value, void **data) {
  return api->GetTensorMutableData(value, data);
}
