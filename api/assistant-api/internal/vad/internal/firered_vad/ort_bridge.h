// Copyright (c) 2023-2025 RapidaAI
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.
//
// Thin C bridge for ONNX Runtime C API — FireRedVAD copy.
// All symbols are prefixed with FRV_ to avoid duplicate symbol
// errors when linked alongside other packages using ort_bridge.

#ifndef FRV_ORT_BRIDGE_H
#define FRV_ORT_BRIDGE_H

#include <stdlib.h>
#include <string.h>
#include "onnxruntime_c_api.h"

const OrtApi* FRV_OrtGetApi();

const char* FRV_OrtApiGetErrorMessage(const OrtApi *api, OrtStatus *status);

void FRV_OrtApiReleaseStatus(const OrtApi *api, OrtStatus *status);

OrtStatus* FRV_OrtApiCreateEnv(const OrtApi *api, OrtLoggingLevel log_level, const char *log_id, OrtEnv **env);
void FRV_OrtApiReleaseEnv(const OrtApi *api, OrtEnv *env);

OrtStatus* FRV_OrtApiCreateSessionOptions(const OrtApi *api, OrtSessionOptions **opts);
void FRV_OrtApiReleaseSessionOptions(const OrtApi *api, OrtSessionOptions *opts);

OrtStatus* FRV_OrtApiSetIntraOpNumThreads(const OrtApi *api, OrtSessionOptions *opts, int intra_op_num_threads);
OrtStatus* FRV_OrtApiSetInterOpNumThreads(const OrtApi *api, OrtSessionOptions *opts, int inter_op_num_threads);
OrtStatus* FRV_OrtApiSetSessionGraphOptimizationLevel(const OrtApi *api, OrtSessionOptions *opts, GraphOptimizationLevel level);

OrtStatus* FRV_OrtApiCreateSession(const OrtApi *api, OrtEnv *env, const char *model_path, OrtSessionOptions *opts, OrtSession **session);
void FRV_OrtApiReleaseSession(const OrtApi *api, OrtSession *session);

OrtStatus* FRV_OrtApiCreateCpuMemoryInfo(const OrtApi *api, enum OrtAllocatorType alloc_type, enum OrtMemType mem_type, OrtMemoryInfo **minfo);
void FRV_OrtApiReleaseMemoryInfo(const OrtApi *api, OrtMemoryInfo *minfo);

OrtStatus* FRV_OrtApiCreateTensorWithDataAsOrtValue(const OrtApi *api, const OrtMemoryInfo *minfo, void *data, size_t data_len,
    const int64_t *shape, size_t shape_len, ONNXTensorElementDataType data_type, OrtValue **value);
void FRV_OrtApiReleaseValue(const OrtApi *api, OrtValue *value);

OrtStatus* FRV_OrtApiRun(const OrtApi *api, OrtSession *session, const OrtRunOptions *run_options,
    const char *const *input_names, const OrtValue *const *inputs, size_t inputs_len,
    const char *const *output_names, size_t output_names_len, OrtValue **outputs);

OrtStatus* FRV_OrtApiGetTensorMutableData(const OrtApi *api, OrtValue *value, void **data);

#endif // FRV_ORT_BRIDGE_H
