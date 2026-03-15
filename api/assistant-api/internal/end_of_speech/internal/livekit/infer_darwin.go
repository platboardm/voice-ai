// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

//go:build darwin

package internal_livekit

// #cgo CFLAGS: -Wall -Werror -std=c99
// #cgo LDFLAGS: -lonnxruntime
// #include "ort_bridge.h"
import "C"

import (
	"fmt"
	"unsafe"
)

// infer runs ONNX inference with input_ids and attention_mask tensors.
// Returns the raw logits as a flat float32 slice [1, seq_len, vocab_size].
//
// darwin: uses C.longlong for int64 tensor dimensions (arm64: long is 32-bit).
func (td *TurnDetector) infer(inputIDs, attentionMask []int64) ([]float32, error) {
	seqLen := len(inputIDs)

	// --- Input tensor: input_ids [1, seq_len] ---
	var idsValue *C.OrtValue
	idsDims := []C.longlong{1, C.longlong(seqLen)}
	status := C.LktOrtApiCreateTensorWithDataAsOrtValue(td.api, td.memoryInfo,
		unsafe.Pointer(&inputIDs[0]), C.size_t(seqLen*8),
		(*C.int64_t)(unsafe.Pointer(&idsDims[0])), C.size_t(len(idsDims)),
		C.ONNX_TENSOR_ELEMENT_DATA_TYPE_INT64, &idsValue)
	defer C.LktOrtApiReleaseStatus(td.api, status)
	if status != nil {
		return nil, fmt.Errorf("turn_detector: create input_ids tensor: %s", C.GoString(C.LktOrtApiGetErrorMessage(td.api, status)))
	}
	defer C.LktOrtApiReleaseValue(td.api, idsValue)

	// --- Input tensor: attention_mask [1, seq_len] ---
	var maskValue *C.OrtValue
	maskDims := []C.longlong{1, C.longlong(seqLen)}
	status = C.LktOrtApiCreateTensorWithDataAsOrtValue(td.api, td.memoryInfo,
		unsafe.Pointer(&attentionMask[0]), C.size_t(seqLen*8),
		(*C.int64_t)(unsafe.Pointer(&maskDims[0])), C.size_t(len(maskDims)),
		C.ONNX_TENSOR_ELEMENT_DATA_TYPE_INT64, &maskValue)
	defer C.LktOrtApiReleaseStatus(td.api, status)
	if status != nil {
		return nil, fmt.Errorf("turn_detector: create attention_mask tensor: %s", C.GoString(C.LktOrtApiGetErrorMessage(td.api, status)))
	}
	defer C.LktOrtApiReleaseValue(td.api, maskValue)

	// --- Run inference ---
	inputs := []*C.OrtValue{idsValue, maskValue}
	outputs := []*C.OrtValue{nil}
	inputNames := []*C.char{td.cStrings["input_ids"], td.cStrings["attention_mask"]}
	outputNames := []*C.char{td.cStrings["logits"]}

	status = C.LktOrtApiRun(td.api, td.session, nil,
		&inputNames[0], &inputs[0], C.size_t(len(inputNames)),
		&outputNames[0], C.size_t(len(outputNames)), &outputs[0])
	defer C.LktOrtApiReleaseStatus(td.api, status)
	if status != nil {
		return nil, fmt.Errorf("turn_detector: run inference: %s", C.GoString(C.LktOrtApiGetErrorMessage(td.api, status)))
	}

	// --- Extract logits ---
	var logitsPtr unsafe.Pointer
	status = C.LktOrtApiGetTensorMutableData(td.api, outputs[0], &logitsPtr)
	defer C.LktOrtApiReleaseStatus(td.api, status)
	if status != nil {
		C.LktOrtApiReleaseValue(td.api, outputs[0])
		return nil, fmt.Errorf("turn_detector: get logits data: %s", C.GoString(C.LktOrtApiGetErrorMessage(td.api, status)))
	}

	// Copy logits before releasing the output tensor
	totalFloats := seqLen * vocabSize
	logits := make([]float32, totalFloats)
	C.memcpy(unsafe.Pointer(&logits[0]), logitsPtr, C.size_t(totalFloats*4))

	C.LktOrtApiReleaseValue(td.api, outputs[0])
	return logits, nil
}
