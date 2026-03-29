import { FC } from 'react';
import { ActionableNotification } from '@carbon/react';
import { cn } from '@/utils';

export const DocNoticeBlock: FC<{
  children: React.ReactNode;
  docUrl: string;
  linkText?: string;
  tone?: 'yellow' | 'blue';
}> = ({
  children,
  docUrl,
  linkText = 'Read documentation',
  tone = 'yellow',
}) => {
  return (
    <ActionableNotification
      kind={tone === 'blue' ? 'info' : 'warning'}
      title=""
      subtitle={typeof children === 'string' ? children : ''}
      actionButtonLabel={linkText}
      onActionButtonClick={() => window.open(docUrl, '_blank')}
      lowContrast
      hideCloseButton
      inline
      className={cn('!max-w-full notice-link-style')}
    >
      {typeof children !== 'string' && (
        <span className="text-sm">{children}</span>
      )}
    </ActionableNotification>
  );
};
