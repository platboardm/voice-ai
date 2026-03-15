import { Metadata } from '@rapidaai/react';
import { SliderField } from '@/app/components/providers/end-of-speech/slider-field';
import { useVadParams } from '@/app/components/providers/vad/use-vad-params';
import { BlueNoticeBlock } from '@/app/components/container/message/notice-block';
export const ConfigureTenVAD: React.FC<{
  onParameterChange: (parameters: Metadata[]) => void;
  parameters: Metadata[];
}> = ({ onParameterChange, parameters }) => {
  const { get, set } = useVadParams(parameters, onParameterChange);

  return (
    <>
      <BlueNoticeBlock className="text-xs">
        Ten VAD provides voice activity detection with configurable sensitivity.
      </BlueNoticeBlock>
      <SliderField
        label="VAD Threshold"
        hint="Speech probability threshold. Lower = more sensitive, higher = fewer false triggers."
        min={0.3}
        max={1}
        step={0.05}
        parse={parseFloat}
        value={get('microphone.vad.threshold', '0.6')}
        onChange={v => set('microphone.vad.threshold', v)}
      />
    </>
  );
};
