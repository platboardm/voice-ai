# VAD Benchmark Comparison — Silero vs TEN VAD vs FireRed

All benchmarks on Apple M1 Pro, Go 1.25, 16 kHz LINEAR16 mono input.

## At a Glance

| | Silero VAD | TEN VAD | FireRed VAD |
|---|---|---|---|
| **Architecture** | ONNX (Silero NN) | Prebuilt C lib (Agora) | ONNX (DFSMN) + fbank + FFT |
| **Frame size** | 512 samp (32 ms) | 256 samp (16 ms) | 160 shift (10 ms) |
| **Throughput** | **243× RT** | 54× RT | 22× RT |
| **80 ms latency** | **400 µs** | 1.04 ms | 3.66 ms |
| **Init time** | 121 ms | **30 µs** | 16.3 ms |
| **Memory/80ms** | 4.0 KB | **2.7 KB** | 1,329 KB |
| **Allocs/80ms** | **2** | 6 | 114 |
| **Budget used** | 0.5% | 1.3% | 4.6% |

## Detailed Comparison (80 ms production chunk)

| Metric | Silero | TEN VAD | FireRed |
|---|---:|---:|---:|
| ns/op | 400,000 | 1,036,000 | 3,657,000 |
| B/op | 3,968 | 2,728 | 1,328,587 |
| allocs/op | 2 | 6 | 114 |
| % of 80 ms budget | 0.5% | 1.3% | 4.6% |

## Scaling Comparison

| Benchmark | Silero | TEN VAD | FireRed |
|---|---:|---:|---:|
| 500 ms chunk (ns) | 1,988,000 | 6,418,000 | 22,781,000 |
| 1 s chunk (ns) | 4,097,000 | 12,754,000 | 45,214,000 |
| Parallel 8 streams (ns) | 3,697,000 | 18,032,000 | 44,698,000 |
| Seq 100 × 80 ms (ns) | 39,521,000 | 114,450,000 | 440,489,000 |
| Init (ns) | 120,906,000 | 30,271 | 16,340,000 |

## Throughput

| | Silero | TEN VAD | FireRed |
|---|---:|---:|---:|
| samples/sec | 3,887,000 | 870,500 | 355,137 |
| × real-time | 243× | 54× | 22× |

All three are comfortably real-time for production voice streams.

## Qualitative Comparison

| Factor | Silero | TEN VAD | FireRed |
|---|---|---|---|
| **Detection accuracy** | Industry standard; widely deployed | Claims better precision-recall on librispeech/gigaspeech/DNS | DFSMN from FunASR; strong on Chinese+English |
| **End-of-utterance speed** | Known delay of hundreds of ms | Claims fastest speech→silence detection | 4-state machine with configurable min silence |
| **Barge-in detection** | 32 ms granularity | 16 ms granularity (2× finer) | 10 ms granularity (3× finer) |
| **Dependencies** | ONNX Runtime | Prebuilt C lib (313 KB) | ONNX Runtime |
| **Configurability** | Threshold only | Threshold only | Threshold, min speech, min silence, smoothing window |
| **Community** | Massive (LiveKit, Pipecat, Daily) | Agora ecosystem | FunASR/ModelScope |

## Recommendation

| Use case | Recommended VAD | Why |
|---|---|---|
| **Default (conversational AI)** | TEN VAD | Best turn-taking latency, 30µs init, low memory |
| **Maximum throughput** | Silero | 243× RT, lowest per-chunk cost |
| **Chinese/multilingual** | FireRed | DFSMN model trained on Chinese+English corpora |
| **Maximum configurability** | FireRed | 4-state postprocessor, smoothing, min speech/silence |
| **Resource-constrained** | TEN VAD | 2.7 KB/chunk, no ONNX runtime needed |

## Configuration

Set `microphone.vad.provider` in options:

```
"silero_vad"   → Silero VAD (default)
"ten_vad"      → TEN VAD
"firered_vad"  → FireRed VAD
```

## Reproduction

```bash
# Silero VAD
go test -bench=. -benchmem ./api/assistant-api/internal/vad/internal/silero_vad/

# TEN VAD
go test -bench=. -benchmem ./api/assistant-api/internal/vad/internal/ten_vad/

# FireRed VAD
go test -bench=. -benchmem ./api/assistant-api/internal/vad/internal/firered_vad/
```

Benchmarked on Apple M1 Pro, 2026-03-15.
