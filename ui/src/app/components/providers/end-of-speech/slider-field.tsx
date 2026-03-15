import { FormLabel } from '@/app/components/form-label';
import { FieldSet } from '@/app/components/form/fieldset';
import { Slider } from '@/app/components/form/slider';
import { Input } from '@/app/components/form/input';
import { InputHelper } from '@/app/components/input-helper';
import { memo } from 'react';

interface SliderFieldProps {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: string;
  inputWidth?: string;
  parse?: (v: string) => number;
  onChange: (value: string) => void;
}

export const SliderField = memo<SliderFieldProps>(
  ({
    label,
    hint,
    min,
    max,
    step,
    value,
    inputWidth = 'w-16',
    parse = parseInt,
    onChange,
  }) => (
    <FieldSet className="col-span-1">
      <FormLabel>{label}</FormLabel>
      <div className="flex space-x-2 justify-center items-center">
        <Slider
          min={min}
          max={max}
          step={step}
          value={parse(value)}
          onSlide={v => onChange(v.toString())}
        />
        <Input
          min={min}
          max={max}
          className={`bg-light-background ${inputWidth}`}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      <InputHelper>{hint}</InputHelper>
    </FieldSet>
  ),
);
