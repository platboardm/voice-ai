import { Metadata } from '@rapidaai/react';

import { SliderField } from '@/app/components/providers/end-of-speech/slider-field';
import { useEosParams } from '@/app/components/providers/end-of-speech/use-eos-params';
import { BlueNoticeBlock } from '../../../container/message/notice-block/index';

export const ConfigureLivekitEOS: React.FC<{
  onParameterChange: (parameters: Metadata[]) => void;
  parameters: Metadata[];
}> = ({ onParameterChange, parameters }) => {
  const { get, set } = useEosParams(parameters, onParameterChange);

  return (
    <>
      <BlueNoticeBlock className="text-xs">
        Uses a language model (SmolLM2-135M) to predict turn completion from
        transcribed text. Reduces false triggers on natural pauses like
        addresses and numbers.
      </BlueNoticeBlock>
      <SliderField
        label="Turn Completion Threshold"
        hint="Probability threshold above which the model considers the turn complete. Lower = faster response, higher = fewer interruptions."
        min={0.01}
        max={0.2}
        step={0.005}
        inputWidth="w-20"
        parse={parseFloat}
        value={get('microphone.eos.threshold', '0.0289')}
        onChange={v => set('microphone.eos.threshold', v)}
      />
      <SliderField
        label="Quick Timeout"
        hint="Silence duration when model predicts user is done speaking (ms)."
        min={50}
        max={1000}
        step={50}
        value={get('microphone.eos.quick_timeout', '200')}
        onChange={v => set('microphone.eos.quick_timeout', v)}
      />
      <SliderField
        label="Extended Timeout"
        hint="Silence duration when model predicts user is still speaking (ms)."
        min={500}
        max={5000}
        step={100}
        value={get('microphone.eos.silence_timeout', '2000')}
        onChange={v => set('microphone.eos.silence_timeout', v)}
      />
      <SliderField
        label="Fallback Timeout"
        hint="Silence timeout used when model inference fails (ms)."
        min={500}
        max={4000}
        step={100}
        value={get('microphone.eos.timeout', '500')}
        onChange={v => set('microphone.eos.timeout', v)}
      />
    </>
  );
};
