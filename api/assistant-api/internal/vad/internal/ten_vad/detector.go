// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.
package internal_ten_vad

// #cgo CFLAGS: -Wall
// #cgo darwin LDFLAGS: -F${SRCDIR}/lib/macOS -framework ten_vad -Wl,-rpath,${SRCDIR}/lib/macOS
// #cgo linux,amd64 LDFLAGS: -L/opt/ten_vad/lib -lten_vad -Wl,-rpath,/opt/ten_vad/lib
// #include "ten_vad.h"
import "C"

import (
	"fmt"
	"unsafe"
)

// Detector wraps the TEN VAD C library handle.
// NOT safe for concurrent use — the caller must serialize access.
type Detector struct {
	handle  C.ten_vad_handle_t
	hopSize int
}

// NewDetector creates a TEN VAD instance.
// hopSize: number of samples per frame (typically 256 for 16ms at 16kHz).
// threshold: speech detection threshold [0.0, 1.0].
func NewDetector(hopSize int, threshold float32) (*Detector, error) {
	if hopSize <= 0 {
		return nil, fmt.Errorf("ten_vad: invalid hop_size %d", hopSize)
	}
	if threshold < 0 || threshold > 1 {
		return nil, fmt.Errorf("ten_vad: threshold must be in [0.0, 1.0], got %f", threshold)
	}

	var handle C.ten_vad_handle_t
	ret := C.ten_vad_create(&handle, C.size_t(hopSize), C.float(threshold))
	if ret != 0 || handle == nil {
		return nil, fmt.Errorf("ten_vad: create failed (code %d)", int(ret))
	}

	return &Detector{
		handle:  handle,
		hopSize: hopSize,
	}, nil
}

// Process runs VAD on a single frame of int16 PCM samples.
// The frame length must equal hopSize.
// Returns the speech probability and whether speech was detected.
func (d *Detector) Process(frame []int16) (float32, bool, error) {
	if d.handle == nil {
		return 0, false, fmt.Errorf("ten_vad: detector is closed")
	}
	if len(frame) != d.hopSize {
		return 0, false, fmt.Errorf("ten_vad: frame length %d != hop_size %d", len(frame), d.hopSize)
	}

	var probability C.float
	var flag C.int

	ret := C.ten_vad_process(
		d.handle,
		(*C.short)(unsafe.Pointer(&frame[0])),
		C.size_t(d.hopSize),
		&probability,
		&flag,
	)
	if ret != 0 {
		return 0, false, fmt.Errorf("ten_vad: process failed (code %d)", int(ret))
	}

	return float32(probability), flag == 1, nil
}

// Close releases the TEN VAD C resources.
func (d *Detector) Close() {
	if d.handle != nil {
		C.ten_vad_destroy(&d.handle)
		d.handle = nil
	}
}
