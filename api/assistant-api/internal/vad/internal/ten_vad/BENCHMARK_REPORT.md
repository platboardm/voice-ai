# TEN VAD — Benchmark Report (macOS, Apple M1 Pro)

## Environment

- OS: macOS (Darwin, arm64)
- CPU: Apple M1 Pro
- Go: go1.25 (toolchain)
- Library: TEN VAD prebuilt framework (v1.0, Apache 2.0, by Agora)
- Production input: 16 kHz mono LINEAR16, 80 ms chunks (1280 samples)
- TEN VAD frame: 256 samples (16 ms), 5 frames per 80 ms chunk

## Summary

- Initialization: ~30 µs/op (near-zero — no model loading)
- Real-time throughput: ~870K samples/sec (~54× real-time)
- Processing cost (80 ms chunk): ~1.04 ms, ~2.7 KB, ~6 allocs
- Processing cost (500 ms chunk): ~6.42 ms, ~16.6 KB, ~32 allocs
- Processing cost (1 s chunk): ~12.75 ms, ~33.3 KB, ~63 allocs
- Single frame (16 ms): ~207 µs, ~520 B, ~2 allocs

## Detailed Results

| Benchmark | ns/op | B/op | allocs/op |
|---|---:|---:|---:|
| Silence 80 ms | 1,035,797 | 2,728 | 6 |
| Silence 100 ms | 1,241,630 | 3,248 | 7 |
| Silence 500 ms | 6,418,292 | 16,633 | 32 |
| Silence 1 s | 12,753,997 | 33,265 | 63 |
| Speech 80 ms | 1,047,584 | 2,728 | 6 |
| Speech 100 ms | 1,254,596 | 3,248 | 7 |
| Speech 500 ms | 6,464,656 | 16,808 | 35 |
| Speech 1 s | 12,850,516 | 33,786 | 72 |
| Chunk 16 ms (1 frame) | 207,463 | 520 | 2 |
| Chunk 50 ms | 624,565 | 1,816 | 4 |
| Chunk 200 ms | 2,481,682 | 6,624 | 13 |
| Chunk 2 s | 25,907,311 | 66,536 | 126 |
| Threshold 0.1 | 6,449,218 | 16,634 | 32 |
| Threshold 0.5 | 6,614,462 | 16,810 | 35 |
| Threshold 0.9 | 6,471,835 | 16,632 | 32 |
| Parallel 2 streams | 8,756,484 | 33,467 | 69 |
| Parallel 8 streams | 18,032,306 | 134,204 | 273 |
| Sequential 10 × 80 ms | 10,362,905 | 27,280 | 60 |
| Sequential 50 × 80 ms | 51,759,644 | 136,405 | 300 |
| Sequential 100 × 80 ms | 114,450,004 | 272,801 | 600 |
| Mixed speech+silence | 12,952,887 | 33,793 | 73 |
| Mixed alternating | 4,199,133 | 10,913 | 24 |
| Initialization | 30,271 | 1,067 | 9 |
| With callback | 8,544,243 | 16,635 | 32 |
| Throughput (real-time) | 18,380,254 | 33,265 | 63 |

Throughput: ~870,501 samples/sec — **~54× real-time**.

## Production Chunk: 80 ms (1280 samples at 16 kHz)

| Metric | Value |
|---|---|
| Latency per chunk | ~1.04 ms |
| Memory per chunk | ~2.7 KB |
| Allocs per chunk | 6 |
| Budget (80 ms wall clock) | 80,000,000 ns |
| Headroom | **~98.7%** (1.04 ms of 80 ms budget) |

## Key Characteristics

- **Near-zero initialization** (30 µs) — no ONNX model to load, prebuilt C library.
- **16 ms frame granularity** — 2× finer than Silero (32 ms), enabling faster speech boundary detection.
- **Direct int16 input** — no float32 conversion needed, processes raw LINEAR16 PCM.
- **Low memory** — 2.7 KB per 80 ms chunk, 8× less than Silero on longer chunks.
- **Purpose-built for conversational AI** by Agora (real-time communication company).
- **Faster end-of-utterance detection** — published evaluation shows lower speech-to-silence transition latency vs Silero.

## Observations

- Threshold has no measurable impact on performance.
- Allocations scale linearly with chunk duration (~6 allocs per 80 ms).
- Parallel scaling is moderate — 8 streams at ~18 ms/op.
- 54× real-time means <2% of the 80 ms budget is consumed by VAD.

Generated from `go test -bench=. -benchmem ./api/assistant-api/internal/vad/internal/ten_vad/` on Apple M1 Pro.
