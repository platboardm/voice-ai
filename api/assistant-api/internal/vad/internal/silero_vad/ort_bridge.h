// Copyright (c) 2023-2025 RapidaAI
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.
//
// Thin C bridge for ONNX Runtime C API. Each function wraps a single
// OrtApi method pointer so CGO can call it without touching the
// vtable directly from Go.

#ifndef ORT_BRIDGE_H
#define ORT_BRIDGE_H

#include <stdlib.h>
#include <string.h>
#include "onnxruntime_c_api.h"

const OrtApi* OrtGetApi();

const char* OrtApiGetErrorMessage(const OrtApi *api, OrtStatus *status);

void OrtApiReleaseStatus(const OrtApi *api, OrtStatus *status);

OrtStatus* OrtApiCreateEnv(const OrtApi *api, OrtLoggingLevel log_level, const char *log_id, OrtEnv **env);
void OrtApiReleaseEnv(const OrtApi *api, OrtEnv *env);

OrtStatus* OrtApiCreateSessionOptions(const OrtApi *api, OrtSessionOptions **opts);
void OrtApiReleaseSessionOptions(const OrtApi *api, OrtSessionOptions *opts);

OrtStatus* OrtApiSetIntraOpNumThreads(const OrtApi *api, OrtSessionOptions *opts, int intra_op_num_threads);
OrtStatus* OrtApiSetInterOpNumThreads(const OrtApi *api, OrtSessionOptions *opts, int inter_op_num_threads);
OrtStatus* OrtApiSetSessionGraphOptimizationLevel(const OrtApi *api, OrtSessionOptions *opts, GraphOptimizationLevel level);

OrtStatus* OrtApiCreateSession(const OrtApi *api, OrtEnv *env, const char *model_path, OrtSessionOptions *opts, OrtSession **session);
void OrtApiReleaseSession(const OrtApi *api, OrtSession *session);

OrtStatus* OrtApiCreateCpuMemoryInfo(const OrtApi *api, enum OrtAllocatorType alloc_type, enum OrtMemType mem_type, OrtMemoryInfo **minfo);
void OrtApiReleaseMemoryInfo(const OrtApi *api, OrtMemoryInfo *minfo);

OrtStatus* OrtApiCreateTensorWithDataAsOrtValue(const OrtApi *api, const OrtMemoryInfo *minfo, void *data, size_t data_len,
    const int64_t *shape, size_t shape_len, ONNXTensorElementDataType data_type, OrtValue **value);
void OrtApiReleaseValue(const OrtApi *api, OrtValue *value);

OrtStatus* OrtApiRun(const OrtApi *api, OrtSession *session, const OrtRunOptions *run_options,
    const char *const *input_names, const OrtValue *const *inputs, size_t inputs_len,
    const char *const *output_names, size_t output_names_len, OrtValue **outputs);

OrtStatus* OrtApiGetTensorMutableData(const OrtApi *api, OrtValue *value, void **data);

#endif // ORT_BRIDGE_H
