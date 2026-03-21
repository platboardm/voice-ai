import { Metadata } from '@rapidaai/react';
import {
  GetDefaultSpeechToTextIfInvalid,
  ValidateSpeechToTextIfInvalid,
} from '../provider';
import {
  GetAssemblyAIDefaultOptions,
  ValidateAssemblyAIOptions,
} from '@/app/components/providers/speech-to-text/assemblyai/constant';
import {
  GetAWSDefaultOptions,
  ValidateAWSOptions,
} from '@/app/components/providers/speech-to-text/aws/constant';
import {
  GetAzureDefaultOptions,
  ValidateAzureOptions,
} from '@/app/components/providers/speech-to-text/azure-speech-service/constant';
import {
  GetCartesiaDefaultOptions,
  ValidateCartesiaOptions,
} from '@/app/components/providers/speech-to-text/cartesia/constant';
import {
  GetDeepgramDefaultOptions,
  ValidateDeepgramOptions,
} from '@/app/components/providers/speech-to-text/deepgram/constant';
import {
  GetGoogleDefaultOptions,
  ValidateGoogleOptions,
} from '@/app/components/providers/speech-to-text/google-speech-service/constant';
import {
  GetGroqDefaultOptions,
  ValidateGroqOptions,
} from '@/app/components/providers/speech-to-text/groq/constant';
import {
  GetNvidiaDefaultOptions,
  ValidateNvidiaOptions,
} from '@/app/components/providers/speech-to-text/nvidia/constant';
import {
  GetOpenAIDefaultOptions,
  ValidateOpenAIOptions,
} from '@/app/components/providers/speech-to-text/openai/constant';
import {
  GetSarvamDefaultOptions,
  ValidateSarvamOptions,
} from '@/app/components/providers/speech-to-text/sarvam/constant';
import {
  GetSpeechmaticsDefaultOptions,
  ValidateSpeechmaticsOptions,
} from '@/app/components/providers/speech-to-text/speechmatics/constant';

jest.mock('@/app/components/providers', () => ({}));
jest.mock('@/app/components/providers/config-renderer', () => ({
  ConfigRenderer: () => null,
}));
jest.mock('@/app/components/providers/speech-to-text/assemblyai', () => {
  const constants = jest.requireActual(
    '@/app/components/providers/speech-to-text/assemblyai/constant',
  );
  return {
    ConfigureAssemblyAISpeechToText: () => null,
    ...constants,
  };
});
jest.mock('@/app/components/providers/speech-to-text/aws', () => {
  const constants = jest.requireActual(
    '@/app/components/providers/speech-to-text/aws/constant',
  );
  return {
    ConfigureAWSSpeechToText: () => null,
    ...constants,
  };
});
jest.mock('@/app/components/providers/speech-to-text/azure-speech-service', () => {
  const constants = jest.requireActual(
    '@/app/components/providers/speech-to-text/azure-speech-service/constant',
  );
  return {
    ConfigureAzureSpeechToText: () => null,
    ...constants,
  };
});
jest.mock('@/app/components/providers/speech-to-text/cartesia', () => {
  const constants = jest.requireActual(
    '@/app/components/providers/speech-to-text/cartesia/constant',
  );
  return {
    ConfigureCartesiaSpeechToText: () => null,
    ...constants,
  };
});
jest.mock('@/app/components/providers/speech-to-text/deepgram', () => {
  const constants = jest.requireActual(
    '@/app/components/providers/speech-to-text/deepgram/constant',
  );
  return {
    ConfigureDeepgramSpeechToText: () => null,
    ...constants,
  };
});
jest.mock('@/app/components/providers/speech-to-text/google-speech-service', () => {
  const constants = jest.requireActual(
    '@/app/components/providers/speech-to-text/google-speech-service/constant',
  );
  return {
    ConfigureGoogleSpeechToText: () => null,
    ...constants,
  };
});
jest.mock('@/app/components/providers/speech-to-text/groq', () => {
  const constants = jest.requireActual(
    '@/app/components/providers/speech-to-text/groq/constant',
  );
  return {
    ConfigureGroqSpeechToText: () => null,
    ...constants,
  };
});
jest.mock('@/app/components/providers/speech-to-text/nvidia', () => {
  const constants = jest.requireActual(
    '@/app/components/providers/speech-to-text/nvidia/constant',
  );
  return {
    ConfigureNvidiaSpeechToText: () => null,
    ...constants,
  };
});
jest.mock('@/app/components/providers/speech-to-text/openai', () => ({
  ConfigureOpenAISpeechToText: () => null,
}));
jest.mock('@/app/components/providers/speech-to-text/sarvam', () => {
  const constants = jest.requireActual(
    '@/app/components/providers/speech-to-text/sarvam/constant',
  );
  return {
    ConfigureSarvamSpeechToText: () => null,
    ...constants,
  };
});
jest.mock('@/app/components/providers/speech-to-text/speechmatics', () => {
  const constants = jest.requireActual(
    '@/app/components/providers/speech-to-text/speechmatics/constant',
  );
  return {
    ConfigureSpeechmaticsSpeechToText: () => null,
    ...constants,
  };
});

type LegacyFns = {
  getDefault: (current: Metadata[]) => Metadata[];
  validate: (options: Metadata[]) => string | undefined;
};

const legacyByProvider: Record<string, LegacyFns> = {
  'google-speech-service': {
    getDefault: GetGoogleDefaultOptions,
    validate: ValidateGoogleOptions,
  },
  deepgram: {
    getDefault: GetDeepgramDefaultOptions,
    validate: ValidateDeepgramOptions,
  },
  'azure-speech-service': {
    getDefault: GetAzureDefaultOptions,
    validate: ValidateAzureOptions,
  },
  assemblyai: {
    getDefault: GetAssemblyAIDefaultOptions,
    validate: ValidateAssemblyAIOptions,
  },
  cartesia: {
    getDefault: GetCartesiaDefaultOptions,
    validate: ValidateCartesiaOptions,
  },
  sarvamai: {
    getDefault: GetSarvamDefaultOptions,
    validate: ValidateSarvamOptions,
  },
  groq: {
    getDefault: GetGroqDefaultOptions,
    validate: ValidateGroqOptions,
  },
  speechmatics: {
    getDefault: GetSpeechmaticsDefaultOptions,
    validate: ValidateSpeechmaticsOptions,
  },
  nvidia: {
    getDefault: GetNvidiaDefaultOptions,
    validate: ValidateNvidiaOptions,
  },
  openai: {
    getDefault: GetOpenAIDefaultOptions,
    validate: (options: Metadata[]) =>
      ValidateOpenAIOptions(options) ? undefined : 'invalid-openai-options',
  },
  aws: {
    getDefault: GetAWSDefaultOptions,
    validate: ValidateAWSOptions,
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

const withCredential = (source: Metadata[]): Metadata[] => {
  const cloned = cloneMetadata(source);
  const credential = cloned.find(m => m.getKey() === 'rapida.credential_id');
  if (credential) {
    credential.setValue('test-credential');
    return cloned;
  }
  cloned.push(createMetadata('rapida.credential_id', 'test-credential'));
  return cloned;
};

describe('Speech-to-text provider runtime parity', () => {
  const providers = Object.keys(legacyByProvider);

  it.each(providers)(
    '%s defaults remain parity with legacy switch behavior',
    provider => {
      const seed = [
        createMetadata('rapida.credential_id', 'seed-cred'),
        createMetadata('microphone.eos.timeout', '900'),
        createMetadata('custom.key', 'custom'),
      ];
      const legacy = legacyByProvider[provider].getDefault(cloneMetadata(seed));
      const current = GetDefaultSpeechToTextIfInvalid(provider, cloneMetadata(seed));
      expect(normalizeMetadata(current)).toEqual(normalizeMetadata(legacy));
    },
  );

  it.each(providers)(
    '%s validation keeps same pass/fail status as legacy',
    provider => {
      const legacyDefaults = legacyByProvider[provider].getDefault([]);
      const options = withCredential(legacyDefaults);
      const legacyHasError = Boolean(legacyByProvider[provider].validate(options));
      const currentHasError = Boolean(
        ValidateSpeechToTextIfInvalid(provider, cloneMetadata(options)),
      );
      expect(currentHasError).toBe(legacyHasError);
    },
  );

  it('deepgram keeps threshold optional', () => {
    const opts = [
      createMetadata('rapida.credential_id', 'cred'),
      createMetadata('listen.model', 'nova-3'),
      createMetadata('listen.language', 'multi'),
    ];
    expect(ValidateSpeechToTextIfInvalid('deepgram', opts)).toBeUndefined();
  });

  it('assemblyai keeps threshold optional', () => {
    const opts = [
      createMetadata('rapida.credential_id', 'cred'),
      createMetadata('listen.model', 'slam-1'),
      createMetadata('listen.language', 'en'),
    ];
    expect(ValidateSpeechToTextIfInvalid('assemblyai', opts)).toBeUndefined();
  });

  it('unknown provider remains no-op when no config exists', () => {
    const seed = [createMetadata('custom.key', 'custom')];
    expect(
      normalizeMetadata(
        GetDefaultSpeechToTextIfInvalid('unknown-provider', cloneMetadata(seed)),
      ),
    ).toEqual(normalizeMetadata(seed));
    expect(ValidateSpeechToTextIfInvalid('unknown-provider', [])).toBeUndefined();
  });
});
