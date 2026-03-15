// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.
package internal_firered_vad

// #cgo CFLAGS: -Wall -Werror -std=c99
// #cgo LDFLAGS: -lonnxruntime
// #include "ort_bridge.h"
import "C"

import (
	"fmt"
	"unsafe"
)

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const (
	// cacheSize is the total number of float32 elements in the cache
	// tensor: shape [8, 1, 128, 19] = 19456 elements.
	// 8 = DFSMN blocks, 128 = projection dim, 19 = lookback padding
	cacheDim0 = 8
	cacheDim1 = 1
	cacheDim2 = 128
	cacheDim3 = 19
	cacheLen  = cacheDim0 * cacheDim1 * cacheDim2 * cacheDim3 // 19456
)

// -----------------------------------------------------------------------------
// Detector — ONNX Runtime session for FireRedVAD stream model
// -----------------------------------------------------------------------------

// Detector performs voice activity detection using the FireRedVAD ONNX model
// with packed cache for streaming. It manages the ONNX Runtime session and
// maintains the DFSMN cache state across successive calls to Infer.
//
// NOT safe for concurrent use — the caller must serialize access.
type Detector struct {
	api         *C.OrtApi
	env         *C.OrtEnv
	sessionOpts *C.OrtSessionOptions
	session     *C.OrtSession
	memoryInfo  *C.OrtMemoryInfo

	cStrings map[string]*C.char

	// Model cache state carried across inference calls: [1, 1024, 19]
	cache [cacheLen]float32
}

// NewDetector creates a Detector by loading the FireRedVAD ONNX model and
// initializing the inference session. Call Destroy when done.
func NewDetector(modelPath string) (*Detector, error) {
	if modelPath == "" {
		return nil, fmt.Errorf("invalid modelPath: should not be empty")
	}

	d := &Detector{
		cStrings: map[string]*C.char{},
	}

	d.api = C.FRV_OrtGetApi()
	if d.api == nil {
		return nil, fmt.Errorf("failed to get ONNX Runtime API")
	}

	// Create environment
	d.cStrings["loggerName"] = C.CString("firered_vad")
	status := C.FRV_OrtApiCreateEnv(d.api, C.ORT_LOGGING_LEVEL_ERROR, d.cStrings["loggerName"], &d.env)
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		d.cleanup()
		return nil, fmt.Errorf("failed to create env: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}

	// Session options: single-threaded, all optimizations
	status = C.FRV_OrtApiCreateSessionOptions(d.api, &d.sessionOpts)
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		d.cleanup()
		return nil, fmt.Errorf("failed to create session options: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}

	status = C.FRV_OrtApiSetIntraOpNumThreads(d.api, d.sessionOpts, 1)
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		d.cleanup()
		return nil, fmt.Errorf("failed to set intra op threads: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}

	status = C.FRV_OrtApiSetInterOpNumThreads(d.api, d.sessionOpts, 1)
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		d.cleanup()
		return nil, fmt.Errorf("failed to set inter op threads: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}

	status = C.FRV_OrtApiSetSessionGraphOptimizationLevel(d.api, d.sessionOpts, C.ORT_ENABLE_ALL)
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		d.cleanup()
		return nil, fmt.Errorf("failed to set optimization level: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}

	// Load model
	d.cStrings["modelPath"] = C.CString(modelPath)
	status = C.FRV_OrtApiCreateSession(d.api, d.env, d.cStrings["modelPath"], d.sessionOpts, &d.session)
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		d.cleanup()
		return nil, fmt.Errorf("failed to create session: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}

	// CPU memory allocator
	status = C.FRV_OrtApiCreateCpuMemoryInfo(d.api, C.OrtArenaAllocator, C.OrtMemTypeDefault, &d.memoryInfo)
	defer C.FRV_OrtApiReleaseStatus(d.api, status)
	if status != nil {
		d.cleanup()
		return nil, fmt.Errorf("failed to create memory info: %s", C.GoString(C.FRV_OrtApiGetErrorMessage(d.api, status)))
	}

	// Pre-allocate C strings for tensor I/O names
	d.cStrings["feat"] = C.CString("feat")
	d.cStrings["caches_in"] = C.CString("caches_in")
	d.cStrings["probs"] = C.CString("probs")
	d.cStrings["caches_out"] = C.CString("caches_out")

	return d, nil
}

// Reset clears the cache state for reuse with a new audio stream.
func (d *Detector) Reset() {
	if d == nil {
		return
	}
	for i := range d.cache {
		d.cache[i] = 0
	}
}

// Destroy releases all ONNX Runtime resources.
func (d *Detector) Destroy() {
	if d == nil {
		return
	}
	d.cleanup()
}

func (d *Detector) cleanup() {
	if d.memoryInfo != nil {
		C.FRV_OrtApiReleaseMemoryInfo(d.api, d.memoryInfo)
		d.memoryInfo = nil
	}
	if d.session != nil {
		C.FRV_OrtApiReleaseSession(d.api, d.session)
		d.session = nil
	}
	if d.sessionOpts != nil {
		C.FRV_OrtApiReleaseSessionOptions(d.api, d.sessionOpts)
		d.sessionOpts = nil
	}
	if d.env != nil {
		C.FRV_OrtApiReleaseEnv(d.api, d.env)
		d.env = nil
	}
	for k, ptr := range d.cStrings {
		C.free(unsafe.Pointer(ptr))
		delete(d.cStrings, k)
	}
}
