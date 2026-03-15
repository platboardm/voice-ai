import { Dropdown } from '@/app/components/dropdown';
import { FormLabel } from '@/app/components/form-label';
import { FieldSet } from '@/app/components/form/fieldset';
import { ProviderComponentProps } from '@/app/components/providers';
import { VAD } from '@/providers';
import { VADConfigComponent } from '@/app/components/providers/vad/provider';
import { useMemo } from 'react';

const renderLabel = (c: { name: string }) => (
  <span className="inline-flex items-center gap-2 sm:gap-2.5 max-w-full text-sm font-medium">
    <span className="truncate capitalize">{c.name}</span>
  </span>
);

export const VADProvider: React.FC<ProviderComponentProps> = props => {
  const { provider, onChangeProvider } = props;
  const providers = useMemo(() => VAD(), []);

  return (
    <div className="flex flex-col gap-6">
      <FieldSet>
        <FormLabel>VAD provider</FormLabel>
        <Dropdown
          className="bg-light-background max-w-full dark:bg-gray-950"
          currentValue={providers.find(x => x.code === provider)}
          setValue={v => onChangeProvider(v.code)}
          allValue={providers}
          placeholder="Select VAD provider"
          option={renderLabel}
          label={renderLabel}
        />
      </FieldSet>
      {provider && <VADConfigComponent {...props} />}
    </div>
  );
};
