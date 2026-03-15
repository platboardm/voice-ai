// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.

//go:build !darwin

package internal_silero_vad

// #cgo CFLAGS: -Wall -Werror -std=c99
// #cgo LDFLAGS: -lonnxruntime
// #include "ort_bridge.h"
import "C"

import (
	"fmt"
	"unsafe"
)

// infer runs a single ONNX inference pass on one window of audio samples.
// Returns the speech probability [0, 1]. Updates sd.state with the new
// hidden state and saves trailing context for the next call.
//
// linux/other: uses C.long for int64 tensor dimensions (amd64: long is 64-bit).
func (sd *Detector) infer(samples []float32) (float32, error) {
	// Prepend context from the previous window for temporal continuity
	pcm := samples
	if sd.currSample > 0 {
		pcm = append(sd.ctx[:], samples...)
	}
	// Save trailing samples as context for the next call
	copy(sd.ctx[:], samples[len(samples)-contextLen:])

	// --- Input tensor: audio samples [1, N] ---
	var pcmValue *C.OrtValue
	pcmDims := []C.long{1, C.long(len(pcm))}
	status := C.OrtApiCreateTensorWithDataAsOrtValue(sd.api, sd.memoryInfo,
		unsafe.Pointer(&pcm[0]), C.size_t(len(pcm)*4),
		(*C.int64_t)(unsafe.Pointer(&pcmDims[0])), C.size_t(len(pcmDims)),
		C.ONNX_TENSOR_ELEMENT_DATA_TYPE_FLOAT, &pcmValue)
	defer C.OrtApiReleaseStatus(sd.api, status)
	if status != nil {
		return 0, fmt.Errorf("failed to create pcm tensor: %s", C.GoString(C.OrtApiGetErrorMessage(sd.api, status)))
	}
	defer C.OrtApiReleaseValue(sd.api, pcmValue)

	// --- Input tensor: hidden state [2, 1, 128] ---
	var stateValue *C.OrtValue
	stateDims := []C.long{2, 1, 128}
	status = C.OrtApiCreateTensorWithDataAsOrtValue(sd.api, sd.memoryInfo,
		unsafe.Pointer(&sd.state[0]), C.size_t(stateLen*4),
		(*C.int64_t)(unsafe.Pointer(&stateDims[0])), C.size_t(len(stateDims)),
		C.ONNX_TENSOR_ELEMENT_DATA_TYPE_FLOAT, &stateValue)
	defer C.OrtApiReleaseStatus(sd.api, status)
	if status != nil {
		return 0, fmt.Errorf("failed to create state tensor: %s", C.GoString(C.OrtApiGetErrorMessage(sd.api, status)))
	}
	defer C.OrtApiReleaseValue(sd.api, stateValue)

	// --- Input tensor: sample rate [1] ---
	var rateValue *C.OrtValue
	rateDims := []C.long{1}
	rate := []C.int64_t{C.int64_t(sd.cfg.SampleRate)}
	status = C.OrtApiCreateTensorWithDataAsOrtValue(sd.api, sd.memoryInfo,
		unsafe.Pointer(&rate[0]), C.size_t(8),
		(*C.int64_t)(unsafe.Pointer(&rateDims[0])), C.size_t(len(rateDims)),
		C.ONNX_TENSOR_ELEMENT_DATA_TYPE_INT64, &rateValue)
	defer C.OrtApiReleaseStatus(sd.api, status)
	if status != nil {
		return 0, fmt.Errorf("failed to create rate tensor: %s", C.GoString(C.OrtApiGetErrorMessage(sd.api, status)))
	}
	defer C.OrtApiReleaseValue(sd.api, rateValue)

	// --- Run inference ---
	inputs := []*C.OrtValue{pcmValue, stateValue, rateValue}
	outputs := []*C.OrtValue{nil, nil}
	inputNames := []*C.char{sd.cStrings["input"], sd.cStrings["state"], sd.cStrings["sr"]}
	outputNames := []*C.char{sd.cStrings["output"], sd.cStrings["stateN"]}

	status = C.OrtApiRun(sd.api, sd.session, nil,
		&inputNames[0], &inputs[0], C.size_t(len(inputNames)),
		&outputNames[0], C.size_t(len(outputNames)), &outputs[0])
	defer C.OrtApiReleaseStatus(sd.api, status)
	if status != nil {
		return 0, fmt.Errorf("failed to run inference: %s", C.GoString(C.OrtApiGetErrorMessage(sd.api, status)))
	}

	// --- Extract output values before releasing tensors ---
	var probPtr unsafe.Pointer
	var stateNPtr unsafe.Pointer

	status = C.OrtApiGetTensorMutableData(sd.api, outputs[0], &probPtr)
	defer C.OrtApiReleaseStatus(sd.api, status)
	if status != nil {
		C.OrtApiReleaseValue(sd.api, outputs[0])
		C.OrtApiReleaseValue(sd.api, outputs[1])
		return 0, fmt.Errorf("failed to get output tensor data: %s", C.GoString(C.OrtApiGetErrorMessage(sd.api, status)))
	}

	status = C.OrtApiGetTensorMutableData(sd.api, outputs[1], &stateNPtr)
	defer C.OrtApiReleaseStatus(sd.api, status)
	if status != nil {
		C.OrtApiReleaseValue(sd.api, outputs[0])
		C.OrtApiReleaseValue(sd.api, outputs[1])
		return 0, fmt.Errorf("failed to get state tensor data: %s", C.GoString(C.OrtApiGetErrorMessage(sd.api, status)))
	}

	// Copy results before releasing output tensors
	speechProb := *(*float32)(probPtr)
	C.memcpy(unsafe.Pointer(&sd.state[0]), stateNPtr, stateLen*4)

	C.OrtApiReleaseValue(sd.api, outputs[0])
	C.OrtApiReleaseValue(sd.api, outputs[1])

	return speechProb, nil
}
