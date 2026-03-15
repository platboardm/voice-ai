// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.
package internal_pipecat

import (
	"math"
	"math/cmplx"
)

// Whisper feature extraction constants
const (
	whisperSampleRate = 16000
	whisperNFFT       = 400
	whisperHopLength  = 160
	whisperNMels      = 80
	whisperChunkSec   = 8
	whisperMaxSamples = whisperChunkSec * whisperSampleRate // 128000
	whisperMaxFrames  = whisperMaxSamples / whisperHopLength // 800
	whisperNFreqBins  = whisperNFFT/2 + 1                   // 201
	whisperFFTSize    = 512                                  // next power of 2 >= nFFT
)

// Slaney mel scale constants (Auditory Toolbox)
const (
	melFSP      = 200.0 / 3.0
	melMinLogHz = 1000.0
	melMinLogM  = melMinLogHz / melFSP // 15.0
	melLogStep  = 0.06875177742094912  // ln(6.4) / 27
)

// whisperFeatures extracts Whisper-compatible mel spectrogram features from
// raw float32 PCM audio (16kHz mono, normalized to [-1, 1]).
//
// Pre-computes mel filterbank and Hann window at construction time.
type whisperFeatures struct {
	melFilters [whisperNMels][whisperNFreqBins]float64
	hannWindow [whisperNFFT]float64
}

func newWhisperFeatures() *whisperFeatures {
	wf := &whisperFeatures{}
	wf.initHannWindow()
	wf.initMelFilterbank()
	return wf
}

// Extract computes mel spectrogram features from float32 PCM samples (16kHz).
// Returns a flat float32 slice of shape [whisperNMels * whisperMaxFrames] = [80*800].
// Audio is truncated to last 8 seconds or zero-padded at the beginning.
func (wf *whisperFeatures) Extract(audio []float32) []float32 {
	// Truncate to last 8 seconds or pad at beginning
	samples := prepareAudio(audio)

	// Normalize: zero mean, unit variance
	normalize(samples)

	// Center pad with reflect for STFT
	padded := reflectPad(samples, whisperNFFT/2)

	// STFT → power spectrum → mel filterbank
	numFrames := 1 + (len(padded)-whisperNFFT)/whisperHopLength
	if numFrames > whisperMaxFrames+1 {
		numFrames = whisperMaxFrames + 1
	}
	// Drop last frame (Whisper convention)
	numFrames--
	if numFrames > whisperMaxFrames {
		numFrames = whisperMaxFrames
	}

	// Compute log mel spectrogram [nMels][numFrames]
	logMel := make([]float64, whisperNMels*numFrames)
	fftBuf := make([]complex128, whisperFFTSize)
	globalMax := -math.MaxFloat64

	for frame := 0; frame < numFrames; frame++ {
		start := frame * whisperHopLength

		// Apply Hann window and copy to FFT buffer
		for k := range fftBuf {
			fftBuf[k] = 0
		}
		for k := 0; k < whisperNFFT; k++ {
			fftBuf[k] = complex(float64(padded[start+k])*wf.hannWindow[k], 0)
		}

		// In-place FFT
		fft(fftBuf)

		// Power spectrum for each mel filter
		for m := 0; m < whisperNMels; m++ {
			var melVal float64
			for k := 0; k < whisperNFreqBins; k++ {
				if wf.melFilters[m][k] == 0 {
					continue
				}
				r := real(fftBuf[k])
				im := imag(fftBuf[k])
				power := r*r + im*im
				melVal += wf.melFilters[m][k] * power
			}
			// Log10 with floor
			if melVal < 1e-10 {
				melVal = 1e-10
			}
			lv := math.Log10(melVal)
			logMel[m*numFrames+frame] = lv
			if lv > globalMax {
				globalMax = lv
			}
		}
	}

	// Dynamic range compression and normalization
	clampMin := globalMax - 8.0
	out := make([]float32, whisperNMels*whisperMaxFrames)
	for m := 0; m < whisperNMels; m++ {
		for f := 0; f < numFrames; f++ {
			v := logMel[m*numFrames+f]
			if v < clampMin {
				v = clampMin
			}
			out[m*whisperMaxFrames+f] = float32((v + 4.0) / 4.0)
		}
		// Remaining frames (if numFrames < whisperMaxFrames) stay zero
		// which corresponds to the clamped minimum after normalization
		if numFrames < whisperMaxFrames {
			fillVal := float32((clampMin + 4.0) / 4.0)
			for f := numFrames; f < whisperMaxFrames; f++ {
				out[m*whisperMaxFrames+f] = fillVal
			}
		}
	}

	return out
}

// prepareAudio truncates to last 8 seconds or zero-pads at the beginning.
func prepareAudio(audio []float32) []float32 {
	if len(audio) >= whisperMaxSamples {
		return audio[len(audio)-whisperMaxSamples:]
	}
	padded := make([]float32, whisperMaxSamples)
	offset := whisperMaxSamples - len(audio)
	copy(padded[offset:], audio)
	return padded
}

// normalize applies zero-mean unit-variance normalization in-place.
func normalize(samples []float32) {
	n := float64(len(samples))
	if n == 0 {
		return
	}

	var sum float64
	for _, s := range samples {
		sum += float64(s)
	}
	mean := sum / n

	var variance float64
	for _, s := range samples {
		d := float64(s) - mean
		variance += d * d
	}
	variance /= n

	stddev := math.Sqrt(variance + 1e-7)
	for i, s := range samples {
		samples[i] = float32((float64(s) - mean) / stddev)
	}
}

// reflectPad applies reflect padding on both sides of the signal.
func reflectPad(signal []float32, padSize int) []float32 {
	n := len(signal)
	out := make([]float32, padSize+n+padSize)

	// Left reflect: out[0]=signal[padSize], out[1]=signal[padSize-1], ...
	for i := 0; i < padSize; i++ {
		idx := padSize - i
		if idx >= n {
			idx = n - 1
		}
		out[i] = signal[idx]
	}

	// Center: copy signal
	copy(out[padSize:], signal)

	// Right reflect
	for i := 0; i < padSize; i++ {
		idx := n - 2 - i
		if idx < 0 {
			idx = 0
		}
		out[padSize+n+i] = signal[idx]
	}

	return out
}

// fft performs in-place radix-2 Cooley-Tukey FFT.
// Input length must be a power of 2.
func fft(x []complex128) {
	n := len(x)
	if n <= 1 {
		return
	}

	// Bit-reversal permutation
	j := 0
	for i := 1; i < n; i++ {
		bit := n >> 1
		for j&bit != 0 {
			j ^= bit
			bit >>= 1
		}
		j ^= bit
		if i < j {
			x[i], x[j] = x[j], x[i]
		}
	}

	// Butterfly stages
	for size := 2; size <= n; size <<= 1 {
		halfSize := size >> 1
		wBase := -2.0 * math.Pi / float64(size)
		for start := 0; start < n; start += size {
			wn := complex(1, 0)
			wStep := cmplx.Exp(complex(0, wBase))
			for k := 0; k < halfSize; k++ {
				t := wn * x[start+k+halfSize]
				x[start+k+halfSize] = x[start+k] - t
				x[start+k] = x[start+k] + t
				wn *= wStep
			}
		}
	}
}

// initHannWindow pre-computes the Hann window of size nFFT.
// Matches numpy: hann(n+1)[:-1] i.e. periodic Hann window.
func (wf *whisperFeatures) initHannWindow() {
	for i := 0; i < whisperNFFT; i++ {
		wf.hannWindow[i] = 0.5 * (1.0 - math.Cos(2.0*math.Pi*float64(i)/float64(whisperNFFT)))
	}
}

// initMelFilterbank computes the mel filterbank matrix using the Slaney mel
// scale and Slaney normalization (area = 1 per filter).
func (wf *whisperFeatures) initMelFilterbank() {
	fMax := float64(whisperSampleRate) / 2.0

	// n_mels + 2 linearly spaced points in mel domain
	melMin := hzToMel(0)
	melMax := hzToMel(fMax)
	nPoints := whisperNMels + 2
	melPoints := make([]float64, nPoints)
	for i := range melPoints {
		melPoints[i] = melMin + float64(i)*(melMax-melMin)/float64(nPoints-1)
	}

	// Convert back to Hz
	hzPoints := make([]float64, nPoints)
	for i, m := range melPoints {
		hzPoints[i] = melToHz(m)
	}

	// FFT bin frequencies
	fftFreqs := make([]float64, whisperNFreqBins)
	for i := range fftFreqs {
		fftFreqs[i] = float64(i) * float64(whisperSampleRate) / float64(whisperNFFT)
	}

	// Build triangular filters with Slaney normalization
	for i := 0; i < whisperNMels; i++ {
		lower := hzPoints[i]
		center := hzPoints[i+1]
		upper := hzPoints[i+2]

		enorm := 2.0 / (upper - lower) // Slaney normalization

		for j := 0; j < whisperNFreqBins; j++ {
			f := fftFreqs[j]
			if f >= lower && f < center && center > lower {
				wf.melFilters[i][j] = enorm * (f - lower) / (center - lower)
			} else if f >= center && f <= upper && upper > center {
				wf.melFilters[i][j] = enorm * (upper - f) / (upper - center)
			}
		}
	}
}

func hzToMel(hz float64) float64 {
	if hz < melMinLogHz {
		return hz / melFSP
	}
	return melMinLogM + math.Log(hz/melMinLogHz)/melLogStep
}

func melToHz(mel float64) float64 {
	if mel < melMinLogM {
		return melFSP * mel
	}
	return melMinLogHz * math.Exp(melLogStep*(mel-melMinLogM))
}
