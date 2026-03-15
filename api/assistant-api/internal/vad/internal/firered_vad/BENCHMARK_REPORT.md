# FireRed VAD — Benchmark Report (macOS, Apple M1 Pro)

## Environment

- OS: macOS (Darwin, arm64)
- CPU: Apple M1 Pro
- Go: go1.25 (toolchain)
- ONNX Runtime: 1.16.0 (native C bridge)
- Model: `fireredvad_stream_vad_with_cache.onnx` (DFSMN architecture from FunASR)
- Production input: 16 kHz mono LINEAR16, 80 ms chunks (1280 samples)
- Frame: 400 samples (25 ms), 160-sample shift (10 ms), 80-dim log-mel fbank

## Summary

- Initialization: ~16.3 ms/op
- Real-time throughput: ~355K samples/sec (~22× real-time)
- Processing cost (80 ms chunk): ~3.66 ms, ~1.3 MB, ~114 allocs
- Processing cost (500 ms chunk): ~22.8 ms, ~8.3 MB, ~702 allocs
- Processing cost (1 s chunk): ~45.2 ms, ~16.6 MB, ~1403 allocs
- Single frame shift (10 ms): ~448 µs, ~166 KB, ~15 allocs

## Detailed Results

| Benchmark | ns/op | B/op | allocs/op |
|---|---:|---:|---:|
| Silence 80 ms | 3,657,092 | 1,328,587 | 114 |
| Silence 100 ms | 4,520,460 | 1,660,717 | 142 |
| Silence 500 ms | 22,780,998 | 8,302,082 | 702 |
| Silence 1 s | 45,213,662 | 16,599,434 | 1,403 |
| Speech 80 ms | 3,611,722 | 1,328,641 | 114 |
| Speech 100 ms | 5,680,171 | 1,660,716 | 142 |
| Speech 500 ms | 23,026,830 | 8,302,092 | 702 |
| Speech 1 s | 44,862,662 | 16,599,902 | 1,403 |
| Chunk 10 ms (1 shift) | 447,516 | 166,304 | 15 |
| Chunk 50 ms | 2,278,479 | 830,807 | 72 |
| Chunk 200 ms | 9,044,797 | 3,321,468 | 282 |
| Chunk 2 s | 89,072,823 | 33,196,686 | 2,803 |
| Parallel 2 streams | 23,546,078 | 16,603,612 | 1,410 |
| Parallel 8 streams | 44,698,440 | 66,368,154 | 5,632 |
| Sequential 10 × 80 ms | 36,784,431 | 13,286,021 | 1,139 |
| Sequential 50 × 80 ms | 181,061,799 | 66,425,264 | 5,699 |
| Sequential 100 × 80 ms | 440,488,556 | 132,851,578 | 11,409 |
| Mixed speech+silence | 46,353,338 | 16,603,472 | 1,405 |
| Initialization | 16,339,774 | 106,060 | 526 |
| Throughput (real-time) | 45,053,117 | 16,599,360 | 1,402 |

Throughput: ~355,137 samples/sec — **~22× real-time**.

## Production Chunk: 80 ms (1280 samples at 16 kHz)

| Metric | Value |
|---|---|
| Latency per chunk | ~3.66 ms |
| Memory per chunk | ~1.3 MB |
| Allocs per chunk | 114 |
| Budget (80 ms wall clock) | 80,000,000 ns |
| Headroom | **~95.4%** (3.66 ms of 80 ms budget) |

## Processing Pipeline (per 80 ms chunk)

Each 80 ms chunk (1280 samples) produces ~8 fbank frames (160-sample shift).
For each frame:

1. **Pre-emphasis** — 0.97 coefficient (Kaldi default)
2. **Povey window** — Hann^0.85
3. **512-pt FFT** — split-radix, pure Go
4. **80 mel bins** — triangular filterbank, log power spectrum
5. **CMVN** — per-feature mean/variance normalization
6. **ONNX inference** — DFSMN model with [8,1,128,19] cache state
7. **4-state postprocessor** — smoothed probability, speech start/end events

## Key Characteristics

- **10 ms frame shift** — finest granularity of all three VAD implementations.
- **DFSMN architecture** — Deep Feedforward Sequential Memory Network from FunASR/ModelScope.
- **Kaldi-compatible features** — 80-dim log-mel fbank, matching FunASR training pipeline.
- **Rich postprocessor** — 4-state machine with probability smoothing, configurable min speech/silence durations.
- **High memory usage** — ~1.3 MB per 80 ms chunk due to FFT and fbank allocations.
- **Streaming cache** — [8,1,128,19] float32 state carried across calls for temporal context.
- **Strong on Chinese + English** — DFSMN model from FunASR is well-validated on multilingual speech.

## Observations

- Memory is dominated by FFT power spectrum allocations (~166 KB per frame).
- 22× real-time is comfortably real-time but leaves less headroom than Silero/TEN VAD.
- Parallel scaling is poor — 8 streams saturate at ~45 ms/op due to heavy per-frame compute.
- Initialization is moderate (~16 ms) — ONNX model loading.

## Optimization Opportunities

- Pre-allocate FFT buffers and reuse across frames (currently allocates per frame).
- Use SIMD/vDSP for FFT on arm64 instead of pure Go split-radix.
- Batch multiple fbank frames into a single ONNX inference call.

Generated from `go test -bench=. -benchmem ./api/assistant-api/internal/vad/internal/firered_vad/` on Apple M1 Pro.
