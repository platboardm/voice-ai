import { loadProviderConfig, loadProviderData } from '../config-loader';

// Clear require cache between tests to reset the module-level caches
beforeEach(() => {
  jest.resetModules();
});

describe('loadProviderConfig', () => {
  it('loads a valid config.json and returns parsed config', () => {
    const config = loadProviderConfig('groq');
    expect(config).not.toBeNull();
    expect(config?.stt).toBeDefined();
    expect(config?.stt?.parameters).toBeInstanceOf(Array);
    expect(config?.stt?.parameters.length).toBeGreaterThan(0);
  });

  it('returns null for provider without config.json', () => {
    const config = loadProviderConfig('nonexistent-provider-xyz');
    expect(config).toBeNull();
  });

  it('returns config with tts section for providers that have it', () => {
    const config = loadProviderConfig('groq');
    expect(config?.tts).toBeDefined();
    expect(config?.tts?.parameters).toBeInstanceOf(Array);
  });

  it('returns correct parameter structure', () => {
    const config = loadProviderConfig('groq');
    const sttParams = config?.stt?.parameters;
    expect(sttParams).toBeDefined();

    const modelParam = sttParams?.find(p => p.key === 'listen.model');
    expect(modelParam).toBeDefined();
    expect(modelParam?.label).toBe('Model');
    expect(modelParam?.type).toBe('dropdown');
    expect(modelParam?.required).toBe(true);
    expect(modelParam?.data).toBe('speech-to-text-models.json');
    expect(modelParam?.valueField).toBe('id');
  });

  it('returns preservePrefix for stt and tts', () => {
    const config = loadProviderConfig('groq');
    expect(config?.stt?.preservePrefix).toBe('microphone.');
    expect(config?.tts?.preservePrefix).toBe('speaker.');
  });

  it('supports provider code aliases when loading config', () => {
    const config = loadProviderConfig('sarvamai');
    expect(config).not.toBeNull();
    expect(config?.stt).toBeDefined();
  });

  it('supports google-speech-service alias when loading config', () => {
    const config = loadProviderConfig('google-speech-service');
    expect(config).not.toBeNull();
    expect(config?.stt).toBeDefined();
  });
});

describe('loadProviderData', () => {
  it('loads data from a valid JSON file', () => {
    const data = loadProviderData('groq', 'speech-to-text-models.json');
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
  });

  it('returns empty array for missing data file', () => {
    const data = loadProviderData('groq', 'nonexistent-file.json');
    expect(data).toEqual([]);
  });

  it('returns empty array for missing provider', () => {
    const data = loadProviderData('nonexistent-provider-xyz', 'models.json');
    expect(data).toEqual([]);
  });

  it('loads voice data with correct fields', () => {
    const data = loadProviderData('groq', 'voices.json');
    expect(data).toBeInstanceOf(Array);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('voice_id');
      expect(data[0]).toHaveProperty('name');
    }
  });

  it('supports provider code aliases when loading data', () => {
    const data = loadProviderData('sarvamai', 'speech-to-text-models.json');
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('model_id');
  });

  it('supports google-speech-service alias when loading data', () => {
    const data = loadProviderData('google-speech-service', 'speech-to-text-language.json');
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('code');
  });
});
