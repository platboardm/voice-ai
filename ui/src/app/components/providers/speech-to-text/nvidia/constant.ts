/**
 * Rapida – Open Source Voice AI Orchestration Platform
 * Copyright (C) 2023-2025 Prashant Srivastav <prashant@rapida.ai>
 * Licensed under a modified GPL-2.0. See the LICENSE file for details.
 */
import { NVIDIA_LANGUAGE } from '@/providers';
import { SetMetadata } from '@/utils/metadata';
import { Metadata } from '@rapidaai/react';

export const GetNvidiaDefaultOptions = (current: Metadata[]): Metadata[] => {
  const mtds: Metadata[] = [];

  // Define the keys we want to keep
  const keysToKeep = ['rapida.credential_id', 'listen.language'];

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
  addMetadata('listen.language', 'en-US', value =>
    NVIDIA_LANGUAGE().some(l => l.language_id === value),
  );

  // Only return metadata for the keys we want to keep
  return [
    ...mtds.filter(m => keysToKeep.includes(m.getKey())),
    ...current.filter(m => m.getKey().startsWith('microphone.')),
  ];
};

export const ValidateNvidiaOptions = (
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
    return 'Please provide a valid nvidia credential for speech to text.';
  }

  // Validate language
  const languageOption = options.find(
    opt => opt.getKey() === 'listen.language',
  );
  if (
    !languageOption ||
    !NVIDIA_LANGUAGE().some(
      lang => lang.language_id === languageOption.getValue(),
    )
  ) {
    return 'Please provide a valid nvidia language for speech to text.';
  }

  return undefined;
};
