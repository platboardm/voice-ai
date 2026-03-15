// Copyright (c) 2023-2025 RapidaAI
// Author: Prashant Srivastav <prashant@rapida.ai>
//
// Licensed under GPL-2.0 with Rapida Additional Terms.
// See LICENSE.md or contact sales@rapida.ai for commercial usage.
package internal_firered_vad

import (
	"math"
)

// -----------------------------------------------------------------------------
// Constants — matches Kaldi / kaldi_native_fbank defaults for FireRedVAD
// -----------------------------------------------------------------------------

const (
	featDim        = 80    // Number of mel filterbank bins
	sampleRate     = 16000 // Input sample rate (Hz)
	frameLengthMs  = 25    // Frame length in milliseconds
	frameShiftMs   = 10    // Frame shift in milliseconds
	frameLenSample = sampleRate * frameLengthMs / 1000 // 400 samples
	frameShiftSamp = sampleRate * frameShiftMs / 1000  // 160 samples
	fftSize        = 512   // Next power of 2 >= frameLenSample
	preemphCoeff   = 0.97  // Pre-emphasis coefficient (Kaldi default)
	melLowFreq     = 20.0  // Mel filterbank low frequency
	melHighFreq    = 8000.0 // Nyquist for 16 kHz
)

// -----------------------------------------------------------------------------
// FbankExtractor — Kaldi-compatible log-mel filterbank feature extractor
// -----------------------------------------------------------------------------

// FbankExtractor computes 80-dim log-mel filterbank features compatible
// with the Kaldi configuration used by FireRedVAD:
//   - 25ms frames, 10ms shift, 16kHz sample rate
//   - 80 mel bins, Povey window, 0.97 pre-emphasis
//   - snip_edges=true, dither=0
type FbankExtractor struct {
	window     [frameLenSample]float32
	melFilters [][]melBin // sparse representation: for each FFT bin, list of (melIdx, weight)
}

type melBin struct {
	idx    int
	weight float32
}

// NewFbankExtractor initialises the window function and mel filterbank.
func NewFbankExtractor() *FbankExtractor {
	fb := &FbankExtractor{}
	fb.initPoveyWindow()
	fb.initMelFilterbank()
	return fb
}

// Extract computes a single frame of 80-dim log-mel fbank features
// from exactly frameLenSample (400) int16 PCM samples.
// The result is written into out (must be len >= featDim).
func (fb *FbankExtractor) Extract(samples []int16, out []float32) {
	// 1. Convert to float and apply pre-emphasis
	var frame [frameLenSample]float32
	frame[0] = float32(samples[0]) - preemphCoeff*float32(samples[0])
	for i := 1; i < frameLenSample; i++ {
		frame[i] = float32(samples[i]) - preemphCoeff*float32(samples[i-1])
	}

	// 2. Apply Povey window
	for i := 0; i < frameLenSample; i++ {
		frame[i] *= fb.window[i]
	}

	// 3. FFT — compute power spectrum
	powerSpec := fb.powerSpectrum(frame[:])

	// 4. Apply mel filterbank
	for d := 0; d < featDim; d++ {
		out[d] = 0
	}
	for bin := 0; bin < len(fb.melFilters); bin++ {
		for _, mb := range fb.melFilters[bin] {
			out[mb.idx] += powerSpec[bin] * mb.weight
		}
	}

	// 5. Log (with floor to avoid -inf)
	for d := 0; d < featDim; d++ {
		if out[d] < 1.0e-10 {
			out[d] = 1.0e-10
		}
		out[d] = float32(math.Log(float64(out[d])))
	}
}

// initPoveyWindow precomputes the Povey window (Kaldi default).
// Povey window = Hann^0.85
func (fb *FbankExtractor) initPoveyWindow() {
	for i := 0; i < frameLenSample; i++ {
		// Hann window
		hann := 0.5 - 0.5*math.Cos(2.0*math.Pi*float64(i)/float64(frameLenSample))
		// Povey: raise to 0.85
		fb.window[i] = float32(math.Pow(hann, 0.85))
	}
}

// initMelFilterbank precomputes the triangular mel filterbank weights.
func (fb *FbankExtractor) initMelFilterbank() {
	numFFTBins := fftSize/2 + 1 // 257
	fb.melFilters = make([][]melBin, numFFTBins)

	// Compute mel bin center frequencies
	melLow := hertzToMel(melLowFreq)
	melHigh := hertzToMel(melHighFreq)

	melPoints := make([]float64, featDim+2)
	for i := 0; i <= featDim+1; i++ {
		melPoints[i] = melLow + float64(i)*(melHigh-melLow)/float64(featDim+1)
	}

	// Convert mel points back to Hz, then to FFT bin indices
	binFreqs := make([]float64, featDim+2)
	for i := range binFreqs {
		binFreqs[i] = melToHertz(melPoints[i])
	}

	for bin := 0; bin < numFFTBins; bin++ {
		freqHz := float64(bin) * float64(sampleRate) / float64(fftSize)
		var entries []melBin

		for m := 0; m < featDim; m++ {
			lo := binFreqs[m]
			center := binFreqs[m+1]
			hi := binFreqs[m+2]

			var weight float64
			if freqHz >= lo && freqHz <= center && center > lo {
				weight = (freqHz - lo) / (center - lo)
			} else if freqHz > center && freqHz <= hi && hi > center {
				weight = (hi - freqHz) / (hi - center)
			}

			if weight > 0 {
				entries = append(entries, melBin{idx: m, weight: float32(weight)})
			}
		}
		fb.melFilters[bin] = entries
	}
}

// powerSpectrum computes the power spectrum of a windowed frame using
// a simple real-valued DFT. Returns (fftSize/2 + 1) power values.
func (fb *FbankExtractor) powerSpectrum(frame []float32) []float32 {
	numBins := fftSize/2 + 1
	power := make([]float32, numBins)

	// Zero-pad frame to fftSize
	var padded [fftSize]float64
	for i := 0; i < frameLenSample && i < fftSize; i++ {
		padded[i] = float64(frame[i])
	}

	// In-place split-radix FFT
	realFFT(padded[:])

	// After realFFT, padded contains interleaved real/imag:
	// padded[0] = DC real, padded[1] = Nyquist real
	// padded[2k] = real[k], padded[2k+1] = imag[k] for k=1..N/2-1
	power[0] = float32(padded[0] * padded[0])
	power[numBins-1] = float32(padded[1] * padded[1])
	for k := 1; k < numBins-1; k++ {
		re := padded[2*k]
		im := padded[2*k+1]
		power[k] = float32(re*re + im*im)
	}

	return power
}

// realFFT computes a real-valued FFT in-place on a buffer of size N (power of 2).
// Output is packed as: buf[0]=DC, buf[1]=Nyquist, then (real, imag) pairs.
// This follows the Kaldi srfft.cc / split-radix approach.
func realFFT(buf []float64) {
	n := len(buf)
	// Bit-reversal and Cooley-Tukey complex FFT on n/2 complex points
	halfN := n / 2

	// Treat as n/2 complex numbers: (buf[2k], buf[2k+1])
	// Bit-reversal permutation
	j := 0
	for i := 0; i < halfN-1; i++ {
		if i < j {
			buf[2*i], buf[2*j] = buf[2*j], buf[2*i]
			buf[2*i+1], buf[2*j+1] = buf[2*j+1], buf[2*i+1]
		}
		k := halfN >> 1
		for k <= j {
			j -= k
			k >>= 1
		}
		j += k
	}

	// Cooley-Tukey butterfly
	for size := 2; size <= halfN; size <<= 1 {
		halfSize := size >> 1
		tableStep := halfN / size
		for i := 0; i < halfN; i += size {
			for k := 0; k < halfSize; k++ {
				angle := -2.0 * math.Pi * float64(k*tableStep) / float64(halfN)
				wr := math.Cos(angle)
				wi := math.Sin(angle)

				idx1 := 2 * (i + k)
				idx2 := 2 * (i + k + halfSize)

				tr := wr*buf[idx2] - wi*buf[idx2+1]
				ti := wr*buf[idx2+1] + wi*buf[idx2]

				buf[idx2] = buf[idx1] - tr
				buf[idx2+1] = buf[idx1+1] - ti
				buf[idx1] += tr
				buf[idx1+1] += ti
			}
		}
	}

	// Unpack: convert n/2-point complex FFT to n-point real FFT
	tmpR := buf[0]
	tmpI := buf[1]
	buf[0] = tmpR + tmpI // DC
	buf[1] = tmpR - tmpI // Nyquist
	for k := 1; k < halfN/2; k++ {
		rk := buf[2*k]
		ik := buf[2*k+1]
		rnk := buf[n-2*k]
		ink := buf[n-2*k+1]

		angle := -math.Pi * float64(k) / float64(halfN)
		wr := math.Cos(angle)
		wi := math.Sin(angle)

		// X_e = (Z[k] + Z*[N/2-k]) / 2
		er := (rk + rnk) / 2
		ei := (ik - ink) / 2
		// X_o = (Z[k] - Z*[N/2-k]) / 2 * W
		or_ := (rk - rnk) / 2
		oi := (ik + ink) / 2
		// Twiddle: (or_ + j*oi) * (wr + j*wi)
		tr := or_*wr - oi*wi
		ti := or_*wi + oi*wr

		buf[2*k] = er + tr
		buf[2*k+1] = ei + ti
		buf[n-2*k] = er - tr
		buf[n-2*k+1] = -(ei - ti)
	}
}

// hertzToMel converts frequency in Hz to mel scale (HTK formula).
func hertzToMel(hz float64) float64 {
	return 1127.0 * math.Log(1.0+hz/700.0)
}

// melToHertz converts mel scale to frequency in Hz (HTK formula).
func melToHertz(mel float64) float64 {
	return 700.0 * (math.Exp(mel/1127.0) - 1.0)
}
