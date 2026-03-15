import { ProviderComponentProps } from '@/app/components/providers';
import { ConfigureSileroVAD } from '@/app/components/providers/vad/silero-vad';
import { ConfigureTenVAD } from '@/app/components/providers/vad/ten-vad';
import { ConfigureFireRedVAD } from '@/app/components/providers/vad/firered-vad';
import { FC } from 'react';

export const VADConfigComponent: FC<ProviderComponentProps> = ({
  provider,
  parameters,
  onChangeParameter,
}) => {
  switch (provider) {
    case 'silero_vad':
      return (
        <ConfigureSileroVAD
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    case 'ten_vad':
      return (
        <ConfigureTenVAD
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    case 'firered_vad':
      return (
        <ConfigureFireRedVAD
          parameters={parameters}
          onParameterChange={onChangeParameter}
        />
      );
    default:
      return null;
  }
};
