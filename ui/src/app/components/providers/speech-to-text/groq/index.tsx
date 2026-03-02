/**
 * Rapida – Open Source Voice AI Orchestration Platform
 * Copyright (C) 2023-2025 Prashant Srivastav <prashant@rapida.ai>
 * Licensed under a modified GPL-2.0. See the LICENSE file for details.
 */
import { Metadata } from '@rapidaai/react';
import { Dropdown } from '@/app/components/dropdown';
import { FormLabel } from '@/app/components/form-label';
import { FieldSet } from '@/app/components/form/fieldset';
import {
  GROQ_SPEECH_TO_TEXT_LANGUAGE,
  GROQ_SPEECH_TO_TEXT_MODEL,
} from '@/providers';
export {
  GetGroqDefaultOptions,
  ValidateGroqOptions,
} from '@/app/components/providers/speech-to-text/groq/constant';

const renderOption = (c: { name: string }) => (
  <span className="inline-flex items-center gap-2 sm:gap-2.5 max-w-full text-sm font-medium">
    <span className="truncate capitalize">{c.name}</span>
  </span>
);

export const ConfigureGroqSpeechToText: React.FC<{
  onParameterChange: (parameters: Metadata[]) => void;
  parameters: Metadata[] | null;
}> = ({ onParameterChange, parameters }) => {
  const getParamValue = (key: string) =>
    parameters?.find(p => p.getKey() === key)?.getValue() ?? '';

  const updateParameter = (key: string, value: string) => {
    const updatedParams = [...(parameters || [])];
    const existingIndex = updatedParams.findIndex(p => p.getKey() === key);
    const newParam = new Metadata();
    newParam.setKey(key);
    newParam.setValue(value);
    if (existingIndex >= 0) {
      updatedParams[existingIndex] = newParam;
    } else {
      updatedParams.push(newParam);
    }
    onParameterChange(updatedParams);
  };

  return (
    <>
      <FieldSet className="col-span-1 h-fit" key="listen.model">
        <FormLabel>Model</FormLabel>
        <Dropdown
          className="bg-light-background max-w-full dark:bg-gray-950"
          currentValue={GROQ_SPEECH_TO_TEXT_MODEL().find(
            x => x.id === getParamValue('listen.model'),
          )}
          setValue={(v: { id: string }) => {
            updateParameter('listen.model', v.id);
          }}
          allValue={GROQ_SPEECH_TO_TEXT_MODEL()}
          placeholder="Select model"
          option={renderOption}
          label={renderOption}
        />
      </FieldSet>
      <FieldSet className="col-span-1 h-fit" key="listen.language">
        <FormLabel>Language</FormLabel>
        <Dropdown
          className="bg-light-background max-w-full dark:bg-gray-950"
          currentValue={GROQ_SPEECH_TO_TEXT_LANGUAGE().find(
            x => x.code === getParamValue('listen.language'),
          )}
          setValue={(v: { code: string }) => {
            updateParameter('listen.language', v.code);
          }}
          allValue={GROQ_SPEECH_TO_TEXT_LANGUAGE()}
          placeholder="Select language"
          option={renderOption}
          label={renderOption}
        />
      </FieldSet>
    </>
  );
};
