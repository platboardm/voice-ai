// Copyright (c) 2023-2025 RapidaAI
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

#include "ort_bridge.h"

const OrtApi* OrtGetApi() {
  return OrtGetApiBase()->GetApi(ORT_API_VERSION);
}

const char* OrtApiGetErrorMessage(const OrtApi *api, OrtStatus *status) {
  return api->GetErrorMessage(status);
}

void OrtApiReleaseStatus(const OrtApi *api, OrtStatus *status) {
  if (status != NULL) {
    api->ReleaseStatus(status);
  }
}

OrtStatus* OrtApiCreateEnv(const OrtApi *api, OrtLoggingLevel log_level, const char *log_id, OrtEnv **env) {
  return api->CreateEnv(log_level, log_id, env);
}

void OrtApiReleaseEnv(const OrtApi *api, OrtEnv *env) {
  api->ReleaseEnv(env);
}

OrtStatus* OrtApiCreateSessionOptions(const OrtApi *api, OrtSessionOptions **opts) {
  return api->CreateSessionOptions(opts);
}

void OrtApiReleaseSessionOptions(const OrtApi *api, OrtSessionOptions *opts) {
  api->ReleaseSessionOptions(opts);
}

OrtStatus* OrtApiSetIntraOpNumThreads(const OrtApi *api, OrtSessionOptions *opts, int intra_op_num_threads) {
  return api->SetIntraOpNumThreads(opts, intra_op_num_threads);
}

OrtStatus* OrtApiSetInterOpNumThreads(const OrtApi *api, OrtSessionOptions *opts, int inter_op_num_threads) {
  return api->SetInterOpNumThreads(opts, inter_op_num_threads);
}

OrtStatus* OrtApiSetSessionGraphOptimizationLevel(const OrtApi *api, OrtSessionOptions *opts, GraphOptimizationLevel level) {
  return api->SetSessionGraphOptimizationLevel(opts, level);
}

OrtStatus* OrtApiCreateSession(const OrtApi *api, OrtEnv *env, const char *model_path, OrtSessionOptions *opts, OrtSession **session) {
  return api->CreateSession(env, model_path, opts, session);
}

void OrtApiReleaseSession(const OrtApi *api, OrtSession *session) {
  api->ReleaseSession(session);
}

OrtStatus* OrtApiCreateCpuMemoryInfo(const OrtApi *api, enum OrtAllocatorType alloc_type, enum OrtMemType mem_type, OrtMemoryInfo **minfo) {
  return api->CreateCpuMemoryInfo(alloc_type, mem_type, minfo);
}

void OrtApiReleaseMemoryInfo(const OrtApi *api, OrtMemoryInfo *minfo) {
  api->ReleaseMemoryInfo(minfo);
}

OrtStatus* OrtApiCreateTensorWithDataAsOrtValue(const OrtApi *api, const OrtMemoryInfo *minfo, void *data,
    size_t data_len, const int64_t *shape, size_t shape_len, ONNXTensorElementDataType data_type, OrtValue **value) {
  return api->CreateTensorWithDataAsOrtValue(minfo, data, data_len, shape, shape_len, data_type, value);
}

void OrtApiReleaseValue(const OrtApi *api, OrtValue *value) {
  api->ReleaseValue(value);
}

OrtStatus* OrtApiRun(const OrtApi *api, OrtSession *session, const OrtRunOptions *run_options,
    const char *const *input_names, const OrtValue *const *inputs, size_t inputs_len,
    const char *const *output_names, size_t output_names_len, OrtValue **outputs) {
  return api->Run(session, run_options, input_names, inputs, inputs_len, output_names, output_names_len, outputs);
}

OrtStatus* OrtApiGetTensorMutableData(const OrtApi *api, OrtValue *value, void **data) {
  return api->GetTensorMutableData(value, data);
}
