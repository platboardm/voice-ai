import React from 'react';
import { BillingPlan, BillingSubscription } from '@rapidaai/react';
import {
  Tile,
  Tag,
  Toggletip,
  ToggletipButton,
  ToggletipContent,
} from '@carbon/react';
import {
  UserMultiple,
  ChatBot,
  Connect,
  Folders,
  RecentlyViewed,
  Information,
  Purchase,
} from '@carbon/icons-react';

interface UsageOverviewProps {
  subscription: BillingSubscription.AsObject | null;
  plans: BillingPlan.AsObject[];
  currentPlanSlug: string;
}

const RESOURCE_CONFIG: {
  key: string;
  label: string;
  tooltip: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  formatLimit?: (v: number) => string;
}[] = [
  {
    key: 'users',
    label: 'Users',
    tooltip: 'Number of users in your organization',
    icon: UserMultiple,
  },
  {
    key: 'assistants',
    label: 'Assistants',
    tooltip: 'AI assistants created in your organization',
    icon: ChatBot,
  },
  {
    key: 'endpoints',
    label: 'Endpoints',
    tooltip: 'Active endpoints deployed for your assistants',
    icon: Connect,
  },
  {
    key: 'knowledge_bases',
    label: 'Knowledge Bases',
    tooltip: 'Knowledge bases for RAG-powered assistants',
    icon: Folders,
  },
  {
    key: 'log_retention_days',
    label: 'Log Retention',
    tooltip: 'Number of days conversation logs are retained',
    icon: RecentlyViewed,
    formatLimit: v => `${v} days`,
  },
];

export function UsageOverview({
  subscription,
  plans,
  currentPlanSlug,
}: UsageOverviewProps) {
  const plan =
    subscription?.plan || plans.find(p => p.slug === currentPlanSlug);
  const quotas = plan?.quotasList || [];
  const planName = plan?.name || currentPlanSlug;

  return (
    <Tile className="!rounded-none !p-0 !overflow-hidden !bg-white dark:!bg-transparent border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Purchase size={20} className="text-gray-700 dark:text-gray-300" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Usage & Limits
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Current resource usage for your organization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tag type="blue" size="sm">
            {planName}
          </Tag>
          {subscription && (
            <Tag type="green" size="sm">
              {subscription.status}
            </Tag>
          )}
        </div>
      </div>

      {/* Quota metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-gray-200 dark:divide-gray-700">
        {RESOURCE_CONFIG.map(config => {
          const quota = quotas.find(q => q.resourcetype === config.key);
          const Icon = config.icon;
          const isUnlimited = quota?.quotalimit === -1;
          const limit = quota?.quotalimit ?? 0;
          const used = 0; // TODO: wire up actual usage from backend

          return (
            <div key={config.key} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  size={16}
                  className="text-gray-500 dark:text-gray-400"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {config.label}
                </span>
                <Toggletip align="bottom">
                  <ToggletipButton label={config.label}>
                    <Information
                      size={14}
                      className="text-gray-400 dark:text-gray-500"
                    />
                  </ToggletipButton>
                  <ToggletipContent>
                    <p className="text-xs">{config.tooltip}</p>
                  </ToggletipContent>
                </Toggletip>
              </div>

              {isUnlimited ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-light tabular-nums tracking-tight text-gray-900 dark:text-gray-100">
                    {used}
                  </span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    / Unlimited
                  </span>
                </div>
              ) : config.formatLimit ? (
                <p className="text-4xl font-light tabular-nums tracking-tight text-gray-900 dark:text-gray-100">
                  {config.formatLimit(limit)}
                </p>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-light tabular-nums tracking-tight text-gray-900 dark:text-gray-100">
                    {used}
                  </span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    / {limit}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Tile>
  );
}
