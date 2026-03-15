import { Metadata } from '@rapidaai/react';
import { InputHelper } from '@/app/components/input-helper';
import { SliderField } from '@/app/components/providers/end-of-speech/slider-field';
import { useEosParams } from '@/app/components/providers/end-of-speech/use-eos-params';

export const ConfigureSilenceBasedEOS: React.FC<{
  onParameterChange: (parameters: Metadata[]) => void;
  parameters: Metadata[];
}> = ({ onParameterChange, parameters }) => {
  const { get, set } = useEosParams(parameters, onParameterChange);

  return (
    <>
      <InputHelper>
        Triggers end-of-speech after a fixed silence duration. Simple and
        reliable for most use cases.
      </InputHelper>
      <SliderField
        label="Activity Timeout"
        hint="Duration of silence after which Rapida starts finalizing a message (500-4000ms)."
        min={500}
        max={4000}
        step={100}
        value={get('microphone.eos.timeout', '1000')}
        onChange={v => set('microphone.eos.timeout', v)}
      />
    </>
  );
};
