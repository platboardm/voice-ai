# Silero VAD — Benchmark Report (macOS, Apple M1 Pro)

This report compares the native ONNX Runtime implementation against the
previous `silero-vad-go` library. The native version adds per-window
context prepending (64 samples) for correct temporal continuity on all
platforms, fixes two production bugs, and removes the external dependency.

## Environment

- OS: macOS (Darwin, arm64)
- CPU: Apple M1 Pro
- Go: go1.25 (toolchain)
- ONNX Runtime: 1.16.0 (native C bridge, no third-party Go wrapper)
- Model: `silero_vad_20251001.onnx`
- Production input: 16 kHz mono LINEAR16, 80 ms chunks (1280 samples)
- Silero window: 512 samples (32 ms), 2 windows per 80 ms chunk
- Benchmark runs: 3 iterations per benchmark (`-count=3`)

## Summary

- Initialization: ~123 ms/op
- Real-time throughput: ~3.89M samples/sec (~243× real-time)
- Typical processing cost (500 ms chunk): ~1.99 ms, ~136 KB, ~212 allocs
- Typical processing cost (1 s chunk): ~4.11 ms, ~273 KB, ~436 allocs
- Small chunk (20 ms): ~1.81 µs, ~4.1 KB, ~8 allocs
- Parallel scaling: moderate overhead (8 streams: ~4.70 ms/op, ~1085 KB, ~1713 allocs)

## Detailed Results

| Benchmark | ns/op | B/op | allocs/op |
|---|---:|---:|---:|
| Silence 100 ms | 397,000 | 27,535 | 44 |
| Silence 500 ms | 1,991,000 | 135,502 | 212 |
| Silence 1 s | 4,111,000 | 273,483 | 436 |
| Speech 100 ms | 397,000 | 27,535 | 44 |
| Speech 500 ms | 1,980,000 | 135,502 | 212 |
| Speech 1 s | 4,094,000 | 273,483 | 436 |
| Chunk 20 ms | 1,811 | 4,145 | 8 |
| Chunk 50 ms | 133,900 | 12,207 | 16 |
| Chunk 200 ms | 792,000 | 55,711 | 86 |
| Chunk 2 s | 8,198,000 | 546,965 | 870 |
| Threshold 0.1 | 1,980,000 | 135,501 | 212 |
| Threshold 0.5 | 2,012,000 | 135,501 | 212 |
| Threshold 0.9 | 2,001,000 | 135,501 | 212 |
| Parallel 2 streams | 2,046,000 | 271,202 | 429 |
| Parallel 4 streams | 2,193,000 | 542,405 | 857 |
| Parallel 8 streams | 4,703,000 | 1,084,748 | 1,713 |
| Sequential 10 chunks | 4,367,000 | 275,353 | 440 |
| Sequential 50 chunks | 20,283,000 | 1,376,772 | 2,200 |
| Sequential 100 chunks | 39,699,000 | 2,753,556 | 4,400 |
| Mixed speech+silence | 3,969,000 | 271,004 | 424 |
| Mixed alternating | 1,581,000 | 110,142 | 176 |
| Initialization | 123,350,000 | 2,844 | 16 |
| Memory pressure (small) | 91,400 | 207,286 | 400 |
| Memory pressure (large) | 4,065,000 | 273,482 | 436 |
| With callback | 1,979,000 | 135,501 | 212 |
| Throughput (real-time) | 4,111,000 | 273,483 | 436 |

Throughput: ~3,891,729 samples/sec — **~243× real-time**.

## Comparison with Previous Library (`silero-vad-go v0.2.1`)

| Benchmark | Library (ns/op) | Native (ns/op) | Change |
|---|---:|---:|---|
| Silence 500 ms | 1,681,311 | 1,991,000 | +18% |
| Speech 1 s | 3,447,289 | 4,094,000 | +19% |
| Chunk 20 ms | 1,330 | 1,811 | +36% |
| Chunk 200 ms | 667,062 | 792,000 | +19% |
| Parallel 8 streams | 3,283,569 | 4,703,000 | +43% |
| Sequential 100 chunks | 33,728,309 | 39,699,000 | +18% |
| Initialization | 39,215,726 | 123,350,000 | +215% |
| Throughput | 290× RT | 243× RT | -16% |

The ~18% core processing overhead comes from context prepending (64 samples
per window), which the library skipped on darwin. This fixes incorrect
temporal continuity and improves detection accuracy on macOS.

## Bug Fixes (vs library)

1. **"not enough samples" error** — Small audio chunks (< 512 samples) from
   network jitter caused error log spam on every undersized packet. Now
   returns nil silently.

2. **"unexpected speech end" error** — When speech started in chunk N and
   ended in chunk N+1, the library crashed because the `segments` slice
   was local to each `Detect()` call but `triggered` state carried across
   calls. Now resets state gracefully.

3. **Darwin context bug** — The library skipped context prepending on
   darwin (macOS), causing degraded detection accuracy. Now consistent
   on all platforms.

4. **Use-after-free** — The library read the output probability pointer
   after releasing the ONNX tensor that owned the memory. Now copies
   the value before releasing.

## Production Chunk: 80 ms (1280 samples at 16 kHz)

The 100 ms benchmark is the closest proxy for the production 80 ms chunk.
At 80 ms, each `Process` call runs 2 Silero inference windows (512 samples each).

| Metric | Value |
|---|---|
| Latency per chunk | ~400 µs |
| Memory per chunk | ~28 KB |
| Allocs per chunk | 44 |
| Budget (80 ms wall clock) | 80,000,000 ns |
| Headroom | **~99.5%** (400 µs of 80 ms budget) |

At 243× real-time, the VAD consumes <0.5% of the available time budget
per chunk. This leaves ample headroom for STT, LLM, and TTS processing
in the same pipeline.

## Observations

- Efficiency: 243× real-time is massively over-provisioned for voice streams.
- Allocations: Scale linearly with chunk duration; ~212 allocs per 500 ms chunk.
- Parallelism: Overhead grows with concurrent streams; use bounded workers.
- Threshold: Performance insensitive to threshold; choose based on detection quality.
- Initialization: One-time 123 ms cost per session; irrelevant for long-lived streams.
- No resampling: Input is 16 kHz LINEAR16 mono, converted directly to float32.

## Guidance

- Production chunk size: 80 ms (1280 samples) at 16 kHz LINEAR16 mono.
- Each chunk yields 2 Silero windows — low latency, low allocations.
- Concurrency: Prefer limited goroutine pools; avoid unbounded parallelism.
- Memory: Reuse buffers for streaming to reduce per-chunk allocations.
- Threshold: No performance impact; tune for detection quality (default 0.5).

Generated from `go test -bench=. -benchmem -count=3 ./api/assistant-api/internal/vad/internal/silero_vad/` on Apple M1 Pro.
