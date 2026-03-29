import type { ChangeEvent, FC, ReactNode } from 'react';
import { Search as CarbonSearch } from '@carbon/react';
import { cn } from '@/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchSize = 'sm' | 'md' | 'lg';

export interface CarbonSearchProps {
  id?: string;
  labelText: ReactNode;
  placeholder?: string;
  className?: string;
  size?: SearchSize;
  disabled?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  closeButtonLabelText?: string;
  autoComplete?: string;
  renderIcon?: React.ElementType;
}

/** Carbon Search — search input with clear button and icon. */
export const Search: FC<CarbonSearchProps> = ({
  id,
  labelText,
  placeholder = 'Search...',
  className,
  size = 'md',
  ...rest
}) => {
  return (
    <CarbonSearch
      id={id}
      labelText={labelText}
      placeholder={placeholder}
      className={cn(className)}
      size={size}
      {...rest}
    />
  );
};
