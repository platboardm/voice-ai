import { Metadata } from '@rapidaai/react';
import {
  GetDefaultTextProviderConfigIfInvalid,
  ValidateTextProviderDefaultOptions,
} from '../index';
import {
  GetOpenaiTextProviderDefaultOptions,
  ValidateOpenaiTextProviderDefaultOptions,
} from '@/app/components/providers/text/openai/constants';
import {
  GetAzureTextProviderDefaultOptions,
  ValidateAzureTextProviderDefaultOptions,
} from '@/app/components/providers/text/azure-foundry/constants';
import {
  GetGeminiTextProviderDefaultOptions,
  ValidateGeminiTextProviderDefaultOptions,
} from '@/app/components/providers/text/gemini/constants';
import {
  GetVertexAiTextProviderDefaultOptions,
  ValidateVertexAiTextProviderDefaultOptions,
} from '@/app/components/providers/text/vertexai/constants';
import {
  GetAnthropicTextProviderDefaultOptions,
  ValidateAnthropicTextProviderDefaultOptions,
} from '@/app/components/providers/text/anthropic/constants';
import {
  GetCohereTextProviderDefaultOptions,
  ValidateCohereTextProviderDefaultOptions,
} from '@/app/components/providers/text/cohere/constants';
import { TEXT_PROVIDERS } from '@/providers';

jest.mock('@/app/components/providers', () => ({}));
jest.mock('@/utils', () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
}));
jest.mock('@/app/components/dropdown', () => ({
  Dropdown: () => null,
}));
jest.mock('@/app/components/dropdown/credential-dropdown', () => ({
  CredentialDropdown: () => null,
}));
jest.mock('@/app/components/form/fieldset', () => ({
  FieldSet: ({ children }: any) => children ?? null,
}));
jest.mock('@/app/components/form-label', () => ({
  FormLabel: ({ children }: any) => children ?? null,
}));
jest.mock('@/app/components/providers/config-renderer', () => ({
  ConfigRenderer: () => null,
}));
jest.mock('@/app/components/providers/text/openai', () => ({
  ConfigureOpenaiTextProviderModel: () => null,
}));
jest.mock('@/app/components/providers/text/azure-foundry', () => {
  const constants = jest.requireActual(
    '@/app/components/providers/text/azure-foundry/constants',
  );
  return {
    ConfigureAzureTextProviderModel: () => null,
    ...constants,
  };
});
jest.mock('@/app/components/providers/text/gemini', () => ({
  ConfigureGeminiTextProviderModel: () => null,
}));
jest.mock('@/app/components/providers/text/vertexai', () => ({
  ConfigureVertexAiTextProviderModel: () => null,
}));
jest.mock('@/app/components/providers/text/anthropic', () => ({
  ConfigureAnthropicTextProviderModel: () => null,
}));
jest.mock('@/app/components/providers/text/cohere', () => ({
  ConfigureCohereTextProviderModel: () => null,
}));

type LegacyFns = {
  getDefault: (current: Metadata[]) => Metadata[];
  validate: (options: Metadata[]) => string | undefined;
};

const legacyByProvider: Record<string, LegacyFns> = {
  openai: {
    getDefault: GetOpenaiTextProviderDefaultOptions,
    validate: ValidateOpenaiTextProviderDefaultOptions,
  },
  'azure-foundry': {
    getDefault: GetAzureTextProviderDefaultOptions,
    validate: ValidateAzureTextProviderDefaultOptions,
  },
  gemini: {
    getDefault: GetGeminiTextProviderDefaultOptions,
    validate: ValidateGeminiTextProviderDefaultOptions,
  },
  vertexai: {
    getDefault: GetVertexAiTextProviderDefaultOptions,
    validate: ValidateVertexAiTextProviderDefaultOptions,
  },
  anthropic: {
    getDefault: GetAnthropicTextProviderDefaultOptions,
    validate: ValidateAnthropicTextProviderDefaultOptions,
  },
  cohere: {
    getDefault: GetCohereTextProviderDefaultOptions,
    validate: ValidateCohereTextProviderDefaultOptions,
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

describe('Text provider runtime parity', () => {
  const providers = Object.keys(legacyByProvider);

  it('keeps runtime coverage aligned with configured text providers', () => {
    const configuredProviders = TEXT_PROVIDERS.map(p => p.code).sort();
    const coveredProviders = [...providers].sort();
    expect(configuredProviders).toEqual(coveredProviders);
  });

  it.each(providers)(
    '%s defaults remain parity with legacy switch behavior',
    provider => {
      const seed = [
        createMetadata('rapida.credential_id', 'seed-cred'),
        createMetadata('custom.key', 'custom'),
      ];
      const legacy = legacyByProvider[provider].getDefault(cloneMetadata(seed));
      const current = GetDefaultTextProviderConfigIfInvalid(
        provider,
        cloneMetadata(seed),
      );
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
        ValidateTextProviderDefaultOptions(provider, cloneMetadata(options)),
      );
      expect(currentHasError).toBe(legacyHasError);
    },
  );

  it('unknown provider remains no-op for defaults and returns validation error', () => {
    const seed = [createMetadata('custom.key', 'custom')];
    expect(
      normalizeMetadata(
        GetDefaultTextProviderConfigIfInvalid('unknown-provider', cloneMetadata(seed)),
      ),
    ).toEqual(normalizeMetadata(seed));
    expect(ValidateTextProviderDefaultOptions('unknown-provider', [])).toBe(
      'Please select a valid model and provider.',
    );
  });
});
