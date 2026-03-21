import { ProviderComponentProps } from '@/app/components/providers';
import { ConfigureSilenceBasedEOS } from '@/app/components/providers/end-of-speech/silence-based';
import { ConfigureLivekitEOS } from '@/app/components/providers/end-of-speech/livekit-eos';
import { ConfigurePipecatSmartTurnEOS } from '@/app/components/providers/end-of-speech/pipecat-smart-turn';
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

export const GetDefaultEOSConfig = (
  provider: string,
  current: Metadata[],
): Metadata[] => {
  const config = loadProviderConfig(provider);
  if (!config?.eos) return current;
  const defaults = getDefaultsFromConfig(config, 'eos', current, provider, {
    includeCredential: false,
    replacePrefix: 'microphone.eos.',
  });
  return upsertScopedProvider(
    defaults,
    'microphone.eos.',
    'microphone.eos.provider',
    provider,
  );
};

export const EndOfSpeechConfigComponent: FC<ProviderComponentProps> = ({
  provider,
  parameters,
  onChangeParameter,
}) => {
  switch (provider) {
    case 'silence_based_eos':
      return (
        <ConfigureSilenceBasedEOS
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    case 'livekit_eos':
      return (
        <ConfigureLivekitEOS
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    case 'pipecat_smart_turn_eos':
      return (
        <ConfigurePipecatSmartTurnEOS
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    default:
      return null;
  }
};
