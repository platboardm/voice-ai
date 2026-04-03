import { GhostButton } from '@/app/components/carbon/button';
import { FC } from 'react';

interface ErrorContainerProps {
  code: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export const ErrorContainer: FC<ErrorContainerProps> = ({
  code,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center">
      <p className="text-[120px] font-light leading-none tabular-nums text-gray-900 dark:text-gray-100">
        {code}
      </p>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-4">
        {title}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
        {description}
      </p>
      <div className="mt-8">
        <GhostButton size="lg" type="button" onClick={onAction}>
          {actionLabel}
        </GhostButton>
      </div>
    </div>
  );
};
