import type { FC, ReactNode } from 'react';
import {
  Tooltip as CarbonTooltip,
  DefinitionTooltip as CarbonDefinitionTooltip,
  Toggletip as CarbonToggletip,
  ToggletipButton,
  ToggletipContent,
  ToggletipActions,
} from '@carbon/react';
import { cn } from '@/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type Alignment =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

interface TooltipProps {
  className?: string;
  content: ReactNode;
  align?: Alignment;
  children?: ReactNode;
  description?: string;
}

interface DefinitionTooltipProps {
  className?: string;
  children: ReactNode;
  definition: string;
  align?: Alignment;
  openOnHover?: boolean;
}

interface ToggletipProps {
  className?: string;
  children?: ReactNode;
  content: ReactNode;
  actions?: ReactNode;
  align?: Alignment;
}

// ─── Tooltip (hover) ─────────────────────────────────────────────────────────

/**
 * Carbon Tooltip — renders on hover over the trigger element.
 * Wraps children as the trigger; `content` is shown in the popup.
 */
export const Tooltip: FC<TooltipProps> = ({
  className,
  content,
  children,
  align = 'top',
  description,
}) => {
  return (
    <CarbonTooltip
      label={content}
      align={align}
      description={description || (typeof content === 'string' ? content : '')}
      className={cn(className)}
    >
      <span className="inline-flex items-center">{children}</span>
    </CarbonTooltip>
  );
};

// ─── Definition Tooltip ──────────────────────────────────────────────────────

/**
 * Carbon DefinitionTooltip — inline term with a dotted underline.
 * Click or hover to reveal the definition.
 */
export const DefinitionTip: FC<DefinitionTooltipProps> = ({
  className,
  children,
  definition,
  align = 'bottom',
  openOnHover = true,
}) => {
  return (
    <CarbonDefinitionTooltip
      definition={definition}
      align={align}
      openOnHover={openOnHover}
      className={cn(className)}
    >
      {children}
    </CarbonDefinitionTooltip>
  );
};

// ─── Toggletip ───────────────────────────────────────────────────────────────

/**
 * Carbon Toggletip — click-triggered tooltip with richer content and optional actions.
 * Unlike Tooltip, persists until dismissed and supports interactive content.
 */
export const Toggletip: FC<ToggletipProps> = ({
  className,
  children,
  content,
  actions,
  align = 'bottom',
}) => {
  return (
    <CarbonToggletip align={align} className={cn(className)}>
      <ToggletipButton label="Show information">{children}</ToggletipButton>
      <ToggletipContent>
        {content}
        {actions && <ToggletipActions>{actions}</ToggletipActions>}
      </ToggletipContent>
    </CarbonToggletip>
  );
};
