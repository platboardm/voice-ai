import { Metadata } from '@rapidaai/react';
import { SliderField } from '@/app/components/providers/end-of-speech/slider-field';
import { useVadParams } from '@/app/components/providers/vad/use-vad-params';
import { BlueNoticeBlock } from '@/app/components/container/message/notice-block';
export const ConfigureFireRedVAD: React.FC<{
  onParameterChange: (parameters: Metadata[]) => void;
  parameters: Metadata[];
}> = ({ onParameterChange, parameters }) => {
  const { get, set } = useVadParams(parameters, onParameterChange);

  return (
    <>
      <BlueNoticeBlock className="text-xs">
        FireRed VAD provides high-accuracy voice activity detection with
        configurable speech and silence frame thresholds.
      </BlueNoticeBlock>
      <SliderField
        label="Speech Threshold"
        hint="Probability threshold for detecting speech. Lower = more sensitive."
        min={0.3}
        max={1}
        step={0.05}
        parse={parseFloat}
        value={get('microphone.vad.threshold', '0.5')}
        onChange={v => set('microphone.vad.threshold', v)}
      />
      <SliderField
        label="Min Silence Frames"
        hint="Minimum number of consecutive silence frames before ending a speech segment."
        min={1}
        max={30}
        step={1}
        value={get('microphone.vad.min_silence_frame', '10')}
        onChange={v => set('microphone.vad.min_silence_frame', v)}
      />
      <SliderField
        label="Min Speech Frames"
        hint="Minimum number of consecutive speech frames before starting a speech segment."
        min={1}
        max={20}
        step={1}
        value={get('microphone.vad.min_speech_frame', '3')}
        onChange={v => set('microphone.vad.min_speech_frame', v)}
      />
    </>
  );
};
