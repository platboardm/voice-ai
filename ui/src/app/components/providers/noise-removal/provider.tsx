import { Metadata } from '@rapidaai/react';
import { loadProviderConfig } from '@/providers/config-loader';
import { getDefaultsFromConfig } from '@/providers/config-defaults';

const updateProviderOnly = (
  current: Metadata[],
  provider: string,
): Metadata[] => {
  const updated = current.map(param => {
    if (param.getKey() === 'microphone.denoising.provider') {
      const metadata = new Metadata();
      metadata.setKey('microphone.denoising.provider');
      metadata.setValue(provider);
      return metadata;
    }
    return param;
  });

  if (!updated.some(param => param.getKey() === 'microphone.denoising.provider')) {
    const metadata = new Metadata();
    metadata.setKey('microphone.denoising.provider');
    metadata.setValue(provider);
    updated.push(metadata);
  }

  return updated;
};

export const GetDefaultNoiseCancellationConfig = (
  provider: string,
  current: Metadata[],
): Metadata[] => {
  const config = loadProviderConfig(provider);
  if (!config?.noise) return current;
  const hasNoiseParamsBeyondProvider = config.noise.parameters.some(
    p => p.key !== 'microphone.denoising.provider',
  );
  if (!hasNoiseParamsBeyondProvider) {
    return updateProviderOnly(current, provider);
  }

  return getDefaultsFromConfig(config, 'noise', current, provider, {
    includeCredential: false,
    replacePrefix: 'microphone.denoising.',
  });
};
