/**
 * Rapida – Open Source Voice AI Orchestration Platform
 * Copyright (C) 2023-2025 Prashant Srivastav <prashant@rapida.ai>
 * Licensed under a modified GPL-2.0. See the LICENSE file for details.
 */
import {
  GROQ_SPEECH_TO_TEXT_LANGUAGE,
  GROQ_SPEECH_TO_TEXT_MODEL,
} from '@/providers';
import { SetMetadata } from '@/utils/metadata';
import { Metadata } from '@rapidaai/react';

export const GetGroqDefaultOptions = (current: Metadata[]): Metadata[] => {
  const mtds: Metadata[] = [];

  // Define the keys we want to keep
  const keysToKeep = [
    'rapida.credential_id',
    'listen.language',
    'listen.model',
  ];

  // Function to create or update metadata
  const addMetadata = (
    key: string,
    defaultValue?: string,
    validationFn?: (value: string) => boolean,
  ) => {
    const metadata = SetMetadata(current, key, defaultValue, validationFn);
    if (metadata) mtds.push(metadata);
  };

  addMetadata('rapida.credential_id');

  // Set language
  addMetadata('listen.language', 'en', value =>
    GROQ_SPEECH_TO_TEXT_LANGUAGE().some(l => l.code === value),
  );

  // Set model
  addMetadata('listen.model', 'whisper-large-v3-turbo', value =>
    GROQ_SPEECH_TO_TEXT_MODEL().some(m => m.id === value),
  );

  // Only return metadata for the keys we want to keep
  return [
    ...mtds.filter(m => keysToKeep.includes(m.getKey())),
    ...current.filter(m => m.getKey().startsWith('microphone.')),
  ];
};

export const ValidateGroqOptions = (
  options: Metadata[],
): string | undefined => {
  const credentialID = options.find(
    opt => opt.getKey() === 'rapida.credential_id',
  );
  if (
    !credentialID ||
    !credentialID.getValue() ||
    credentialID.getValue().length === 0
  ) {
    return 'Please provide a valid groq credential for speech to text.';
  }

  // Validate language
  const languageOption = options.find(
    opt => opt.getKey() === 'listen.language',
  );
  if (
    !languageOption ||
    !GROQ_SPEECH_TO_TEXT_LANGUAGE().some(
      lang => lang.code === languageOption.getValue(),
    )
  ) {
    return 'Please provide a valid groq language for speech to text.';
  }

  // Validate model
  const modelOption = options.find(opt => opt.getKey() === 'listen.model');
  if (
    !modelOption ||
    !GROQ_SPEECH_TO_TEXT_MODEL().some(
      model => model.id === modelOption.getValue(),
    )
  ) {
    return 'Please provide a valid groq model for speech to text.';
  }

  return undefined;
};
