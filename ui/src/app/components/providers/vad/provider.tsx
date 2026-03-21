import { ProviderComponentProps } from '@/app/components/providers';
import { ConfigureSileroVAD } from '@/app/components/providers/vad/silero-vad';
import { ConfigureTenVAD } from '@/app/components/providers/vad/ten-vad';
import { ConfigureFireRedVAD } from '@/app/components/providers/vad/firered-vad';
import { loadProviderConfig } from '@/providers/config-loader';
import { getDefaultsFromConfig } from '@/providers/config-defaults';
import { Metadata } from '@rapidaai/react';
import { FC } from 'react';

const upsertScopedProvider = (
  parameters: Metadata[],
  scopePrefix: string,
  key: string,
  value: string,
): Metadata[] => {
  const nonScoped = parameters.filter(p => !p.getKey().startsWith(scopePrefix));
  const scoped = parameters.filter(
    p => p.getKey().startsWith(scopePrefix) && p.getKey() !== key,
  );

  const providerMetadata = new Metadata();
  providerMetadata.setKey(key);
  providerMetadata.setValue(value);

  return [...nonScoped, providerMetadata, ...scoped];
};

export const GetDefaultVADConfig = (
  provider: string,
  current: Metadata[],
): Metadata[] => {
  const config = loadProviderConfig(provider);
  if (!config?.vad) return current;
  const defaults = getDefaultsFromConfig(config, 'vad', current, provider, {
    includeCredential: false,
    replacePrefix: 'microphone.vad.',
  });
  return upsertScopedProvider(
    defaults,
    'microphone.vad.',
    'microphone.vad.provider',
    provider,
  );
};

export const VADConfigComponent: FC<ProviderComponentProps> = ({
  provider,
  parameters,
  onChangeParameter,
}) => {
  switch (provider) {
    case 'silero_vad':
      return (
        <ConfigureSileroVAD
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    case 'ten_vad':
      return (
        <ConfigureTenVAD
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    case 'firered_vad':
      return (
        <ConfigureFireRedVAD
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    default:
      return null;
  }
};
