import { Metadata } from '@rapidaai/react';
import { SetMetadata } from '@/utils/metadata';

jest.mock('@/app/components/providers', () => ({}));
jest.mock('@/app/components/providers/vad/silero-vad', () => ({
  ConfigureSileroVAD: () => null,
}));
jest.mock('@/app/components/providers/vad/ten-vad', () => ({
  ConfigureTenVAD: () => null,
}));
jest.mock('@/app/components/providers/vad/firered-vad', () => ({
  ConfigureFireRedVAD: () => null,
}));
jest.mock('@/app/components/providers/end-of-speech/silence-based', () => ({
  ConfigureSilenceBasedEOS: () => null,
}));
jest.mock('@/app/components/providers/end-of-speech/livekit-eos', () => ({
  ConfigureLivekitEOS: () => null,
}));
jest.mock('@/app/components/providers/end-of-speech/pipecat-smart-turn', () => ({
  ConfigurePipecatSmartTurnEOS: () => null,
}));

const { GetDefaultVADConfig } = require('@/app/components/providers/vad/provider');
const { GetDefaultEOSConfig } = require('@/app/components/providers/end-of-speech/provider');
const {
  GetDefaultNoiseCancellationConfig,
} = require('@/app/components/providers/noise-removal/provider');

const legacyVadDefaults: Record<string, Record<string, string>> = {
  silero_vad: {
    'microphone.vad.threshold': '0.6',
  },
  ten_vad: {
    'microphone.vad.threshold': '0.6',
  },
  firered_vad: {
    'microphone.vad.threshold': '0.5',
    'microphone.vad.min_silence_frame': '10',
    'microphone.vad.min_speech_frame': '3',
  },
};

const legacyEosDefaults: Record<string, Record<string, string>> = {
  silence_based_eos: {
    'microphone.eos.timeout': '700',
  },
  livekit_eos: {
    'microphone.eos.timeout': '500',
    'microphone.eos.threshold': '0.0289',
    'microphone.eos.quick_timeout': '250',
    'microphone.eos.silence_timeout': '3000',
    'microphone.eos.model': 'en',
  },
  pipecat_smart_turn_eos: {
    'microphone.eos.timeout': '500',
    'microphone.eos.threshold': '0.5',
    'microphone.eos.quick_timeout': '250',
    'microphone.eos.silence_timeout': '2000',
  },
};

const createMetadata = (key: string, value: string): Metadata => {
  const m = new Metadata();
  m.setKey(key);
  m.setValue(value);
  return m;
};

const cloneMetadata = (source: Metadata[]): Metadata[] =>
  source.map(m => createMetadata(m.getKey(), m.getValue()));

const normalizeMetadata = (source: Metadata[]): string[] =>
  source
    .map(m => `${m.getKey()}=${m.getValue()}`)
    .sort((a, b) => a.localeCompare(b));

const legacyGetDefaultVADConfig = (
  provider: string,
  current: Metadata[],
): Metadata[] => {
  const defaults = legacyVadDefaults[provider] || {};
  const nonVad = current.filter(m => !m.getKey().startsWith('microphone.vad.'));

  const vadParams: Metadata[] = [];
  const providerMeta = new Metadata();
  providerMeta.setKey('microphone.vad.provider');
  providerMeta.setValue(provider);
  vadParams.push(providerMeta);

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const metadata = SetMetadata(current, key, defaultValue);
    if (metadata) vadParams.push(metadata);
  }

  return [...nonVad, ...vadParams];
};

const legacyGetDefaultEosConfig = (
  provider: string,
  current: Metadata[],
): Metadata[] => {
  const defaults = legacyEosDefaults[provider] || {};
  const nonEos = current.filter(m => !m.getKey().startsWith('microphone.eos.'));

  const eosParams: Metadata[] = [];
  const providerMeta = new Metadata();
  providerMeta.setKey('microphone.eos.provider');
  providerMeta.setValue(provider);
  eosParams.push(providerMeta);

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const metadata = SetMetadata(current, key, defaultValue);
    if (metadata) eosParams.push(metadata);
  }

  return [...nonEos, ...eosParams];
};

const legacyUpdateNoiseProvider = (
  provider: string,
  current: Metadata[],
): Metadata[] => {
  const updatedParams = current.map(param => {
    if (param.getKey() === 'microphone.denoising.provider') {
      return createMetadata('microphone.denoising.provider', provider);
    }
    return createMetadata(param.getKey(), param.getValue());
  });

  if (!updatedParams.some(param => param.getKey() === 'microphone.denoising.provider')) {
    updatedParams.push(createMetadata('microphone.denoising.provider', provider));
  }

  return updatedParams;
};

describe('Audio input advanced defaults parity', () => {
  it.each(['silero_vad', 'ten_vad', 'firered_vad'])(
    '%s VAD defaults stay parity with legacy behavior',
    provider => {
      const seed = [
        createMetadata('rapida.credential_id', 'cred'),
        createMetadata('listen.model', 'nova-3'),
        createMetadata('microphone.vad.provider', 'ten_vad'),
        createMetadata('microphone.vad.threshold', '0.77'),
        createMetadata('microphone.vad.min_silence_frame', '15'),
        createMetadata('microphone.vad.min_speech_frame', '4'),
      ];

      const legacy = legacyGetDefaultVADConfig(provider, cloneMetadata(seed));
      const current = GetDefaultVADConfig(provider, cloneMetadata(seed));
      expect(normalizeMetadata(current)).toEqual(normalizeMetadata(legacy));
    },
  );

  it.each(['silence_based_eos', 'livekit_eos', 'pipecat_smart_turn_eos'])(
    '%s EOS defaults stay parity with legacy behavior',
    provider => {
      const seed = [
        createMetadata('rapida.credential_id', 'cred'),
        createMetadata('listen.model', 'nova-3'),
        createMetadata('microphone.eos.provider', 'silence_based_eos'),
        createMetadata('microphone.eos.timeout', '950'),
        createMetadata('microphone.eos.threshold', '0.02'),
        createMetadata('microphone.eos.quick_timeout', '120'),
        createMetadata('microphone.eos.silence_timeout', '1800'),
        createMetadata('microphone.eos.model', 'custom-model'),
      ];

      const legacy = legacyGetDefaultEosConfig(provider, cloneMetadata(seed));
      const current = GetDefaultEOSConfig(provider, cloneMetadata(seed));
      expect(normalizeMetadata(current)).toEqual(normalizeMetadata(legacy));
    },
  );

  it('noise provider update remains parity and preserves unknown denoising params', () => {
    const seed = [
      createMetadata('listen.model', 'nova-3'),
      createMetadata('microphone.denoising.provider', 'legacy_noise'),
      createMetadata('microphone.denoising.level', 'high'),
    ];

    const legacy = legacyUpdateNoiseProvider('rn_noise', cloneMetadata(seed));
    const current = GetDefaultNoiseCancellationConfig('rn_noise', cloneMetadata(seed));
    expect(normalizeMetadata(current)).toEqual(normalizeMetadata(legacy));
  });

  it('unknown providers are no-op for config-only defaults', () => {
    const seed = [
      createMetadata('listen.model', 'nova-3'),
      createMetadata('microphone.eos.timeout', '700'),
      createMetadata('microphone.vad.threshold', '0.6'),
      createMetadata('microphone.denoising.provider', 'rn_noise'),
    ];

    expect(
      normalizeMetadata(GetDefaultVADConfig('unknown_vad', cloneMetadata(seed))),
    ).toEqual(normalizeMetadata(seed));
    expect(
      normalizeMetadata(GetDefaultEOSConfig('unknown_eos', cloneMetadata(seed))),
    ).toEqual(normalizeMetadata(seed));
    expect(
      normalizeMetadata(
        GetDefaultNoiseCancellationConfig('unknown_noise', cloneMetadata(seed)),
      ),
    ).toEqual(normalizeMetadata(seed));
  });
});
