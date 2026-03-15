import { ProviderComponentProps } from '@/app/components/providers';
import { ConfigureSilenceBasedEOS } from '@/app/components/providers/end-of-speech/silence-based';
import { ConfigureLivekitEOS } from '@/app/components/providers/end-of-speech/livekit-eos';
import { ConfigurePipecatSmartTurnEOS } from '@/app/components/providers/end-of-speech/pipecat-smart-turn';
import { FC } from 'react';

export const EndOfSpeechConfigComponent: FC<ProviderComponentProps> = ({
  provider,
  parameters,
  onChangeParameter,
}) => {
  switch (provider) {
    case 'silence_based_eos':
      return (
        <ConfigureSilenceBasedEOS
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    case 'livekit_eos':
      return (
        <ConfigureLivekitEOS
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    case 'pipecat_smart_turn_eos':
      return (
        <ConfigurePipecatSmartTurnEOS
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    default:
      return null;
  }
};
