// TEN VAD C API header
// Source: https://github.com/TEN-framework/ten-vad
// Licensed under the Apache License, Version 2.0

#ifndef TEN_VAD_H
#define TEN_VAD_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#if defined(__APPLE__)
  #define TENVAD_API __attribute__((visibility("default")))
#elif defined(__ANDROID__) || defined(__linux__)
  #define TENVAD_API __attribute__((visibility("default")))
#elif defined(_WIN32) || defined(__CYGWIN__)
  #ifdef TENVAD_EXPORTS
    #define TENVAD_API __declspec(dllexport)
  #else
    #define TENVAD_API __declspec(dllimport)
  #endif
#else
  #define TENVAD_API
#endif

// Opaque handle to a TEN VAD instance.
typedef void* ten_vad_handle_t;

// Create a VAD instance.
// handle: pointer to receive the instance handle.
// hop_size: number of samples per frame (e.g. 256 for 16ms at 16kHz).
// threshold: speech detection threshold in [0.0, 1.0].
// Returns 0 on success, non-zero on error.
TENVAD_API int ten_vad_create(ten_vad_handle_t* handle, size_t hop_size, float threshold);

// Process a single audio frame.
// handle: VAD instance.
// audio_data: pointer to int16 PCM samples.
// audio_data_length: number of samples (must equal hop_size).
// out_probability: receives the speech probability [0.0, 1.0].
// out_flag: receives 1 if speech detected, 0 otherwise.
// Returns 0 on success, non-zero on error.
TENVAD_API int ten_vad_process(ten_vad_handle_t handle, const int16_t* audio_data,
    size_t audio_data_length, float* out_probability, int* out_flag);

// Destroy a VAD instance and release resources.
// handle: pointer to the instance handle (set to NULL after destroy).
TENVAD_API void ten_vad_destroy(ten_vad_handle_t* handle);

// Get the library version string.
TENVAD_API const char* ten_vad_get_version(void);

#ifdef __cplusplus
}
#endif

#endif // TEN_VAD_H
