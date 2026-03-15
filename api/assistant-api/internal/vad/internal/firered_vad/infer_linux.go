// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

//go:build !darwin

package internal_firered_vad

// #cgo CFLAGS: -Wall -Werror -std=c99
// #cgo LDFLAGS: -lonnxruntime
// #include "ort_bridge.h"
import "C"

import (
	"fmt"
	"unsafe"
)

// Infer runs a single ONNX inference pass on one frame of fbank features.
// Input feat must be exactly featDim (80) float32 values.
// Returns the speech probability [0, 1] and updates d.cache.
//
// linux/other: uses C.long for int64 tensor dimensions (amd64: long is 64-bit).
func (d *Detector) Infer(feat []float32) (float32, error) {
	// --- Input tensor: feat [1, 1, 80] ---
	var featValue *C.OrtValue
	featDims := []C.long{1, 1, C.long(featDim)}
	status := C.FRV_OrtApiCreateTensorWithDataAsOrtValue(d.api, d.memoryInfo,
		unsafe.Pointer(&feat[0]), C.size_t(len(feat)*4),
		(*C.int64_t)(unsafe.Pointer(&featDims[0])), C.size_t(len(featDims)),
		C.ONNX_TENSOR_ELEMENT_DATA_TYPE_FLOAT, &featValue)
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		return 0, fmt.Errorf("failed to create feat tensor: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}
	defer C.FRV_OrtApiReleaseValue(d.api, featValue)

	// --- Input tensor: caches_in [8, 1, 128, 19] ---
	var cacheValue *C.OrtValue
	cacheDims := []C.long{cacheDim0, cacheDim1, cacheDim2, cacheDim3}
	status = C.FRV_OrtApiCreateTensorWithDataAsOrtValue(d.api, d.memoryInfo,
		unsafe.Pointer(&d.cache[0]), C.size_t(cacheLen*4),
		(*C.int64_t)(unsafe.Pointer(&cacheDims[0])), C.size_t(len(cacheDims)),
		C.ONNX_TENSOR_ELEMENT_DATA_TYPE_FLOAT, &cacheValue)
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		return 0, fmt.Errorf("failed to create cache tensor: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}
	defer C.FRV_OrtApiReleaseValue(d.api, cacheValue)

	// --- Run inference ---
	inputs := []*C.OrtValue{featValue, cacheValue}
	outputs := []*C.OrtValue{nil, nil}
	inputNames := []*C.char{d.cStrings["feat"], d.cStrings["caches_in"]}
	outputNames := []*C.char{d.cStrings["probs"], d.cStrings["caches_out"]}

	status = C.FRV_OrtApiRun(d.api, d.session, nil,
		&inputNames[0], &inputs[0], C.size_t(len(inputNames)),
		&outputNames[0], C.size_t(len(outputNames)), &outputs[0])
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		return 0, fmt.Errorf("failed to run inference: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}

	// --- Extract outputs ---
	var probPtr unsafe.Pointer
	var cachePtr unsafe.Pointer

	status = C.FRV_OrtApiGetTensorMutableData(d.api, outputs[0], &probPtr)
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		C.FRV_OrtApiReleaseValue(d.api, outputs[0])
		C.FRV_OrtApiReleaseValue(d.api, outputs[1])
		return 0, fmt.Errorf("failed to get prob tensor data: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}

	status = C.FRV_OrtApiGetTensorMutableData(d.api, outputs[1], &cachePtr)
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		C.FRV_OrtApiReleaseValue(d.api, outputs[0])
		C.FRV_OrtApiReleaseValue(d.api, outputs[1])
		return 0, fmt.Errorf("failed to get cache tensor data: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}

	// Copy results before releasing output tensors
	speechProb := *(*float32)(probPtr)
	C.memcpy(unsafe.Pointer(&d.cache[0]), cachePtr, cacheLen*4)

	C.FRV_OrtApiReleaseValue(d.api, outputs[0])
	C.FRV_OrtApiReleaseValue(d.api, outputs[1])

	return speechProb, nil
}
