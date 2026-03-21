export interface ParameterLinkedField {
  key: string;
  sourceField: string;
}

export interface ParameterShowWhen {
  key: string;
  pattern: string;
}

export interface ParameterChoice {
  label: string;
  value: string;
}

export interface ParameterConfig {
  key: string;
  label: string;
  type: 'dropdown' | 'slider' | 'number' | 'input' | 'textarea' | 'select' | 'json';
  required?: boolean;
  default?: string;
  errorMessage?: string;
  helpText?: string;
  colSpan?: 1 | 2;
  advanced?: boolean;
  showWhen?: ParameterShowWhen;
  linkedField?: ParameterLinkedField;
  // dropdown
  data?: string;
  valueField?: string;
  searchable?: boolean;
  strict?: boolean;
  // slider / number
  min?: number;
  max?: number;
  step?: number;
  // textarea / input
  placeholder?: string;
  rows?: number;
  // select
  choices?: ParameterChoice[];
}

export interface CategoryConfig {
  preservePrefix?: string;
  parameters: ParameterConfig[];
}

export interface ProviderConfig {
  stt?: CategoryConfig;
  tts?: CategoryConfig;
  text?: CategoryConfig;
  vad?: CategoryConfig;
  eos?: CategoryConfig;
  noise?: CategoryConfig;
}

const configCache: Record<string, ProviderConfig | null> = {};
const dataCache: Record<string, any[]> = {};
const PROVIDER_PATH_ALIASES: Record<string, string> = {
  sarvamai: 'sarvam',
  'google-speech-service': 'google',
};

function resolveProviderPath(provider: string): string {
  return PROVIDER_PATH_ALIASES[provider] ?? provider;
}

export function loadProviderConfig(provider: string): ProviderConfig | null {
  const resolvedProvider = resolveProviderPath(provider);
  if (resolvedProvider in configCache) {
    return configCache[resolvedProvider];
  }
  try {
    const config = require(`./${resolvedProvider}/config.json`) as ProviderConfig;
    configCache[resolvedProvider] = config;
    return config;
  } catch {
    configCache[resolvedProvider] = null;
    return null;
  }
}

export function loadProviderData(provider: string, filename: string): any[] {
  const resolvedProvider = resolveProviderPath(provider);
  const cacheKey = `${resolvedProvider}/${filename}`;
  if (cacheKey in dataCache) {
    return dataCache[cacheKey];
  }
  try {
    const data = require(`./${resolvedProvider}/${filename}`);
    dataCache[cacheKey] = data;
    return data;
  } catch {
    dataCache[cacheKey] = [];
    return [];
  }
}
