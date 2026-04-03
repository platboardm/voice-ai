import React from 'react';
import { BillingPlan } from '@rapidaai/react';
import { PrimaryButton } from '@/app/components/carbon/button';
import { Tag } from '@carbon/react';
import { Checkmark, ArrowRight, Chat } from '@carbon/icons-react';

interface PricingTableProps {
  plans: BillingPlan.AsObject[];
  currentPlanSlug: string;
  onChangePlan: (slug: string) => void;
  userId: string;
  organizationId: string;
}

function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount);
}

function buildStripeCheckoutUrl(
  stripeUrl: string,
  planSlug: string,
  userId: string,
  organizationId: string,
): string {
  const callbackUrl = `${window.location.origin}/billing/callback?plan_slug=${encodeURIComponent(planSlug)}`;
  const url = new URL(stripeUrl);
  url.searchParams.set('client_reference_id', organizationId);
  url.searchParams.set('metadata[user_id]', userId);
  url.searchParams.set('metadata[org_id]', organizationId);
  url.searchParams.set('metadata[plan_slug]', planSlug);
  url.searchParams.set('success_url', callbackUrl);
  url.searchParams.set('cancel_url', `${window.location.origin}/billing`);
  return url.toString();
}

const QUOTAS: { key: string; label: string; format?: (v: number) => string }[] = [
  { key: 'users', label: 'Users' },
  { key: 'assistants', label: 'Assistants' },
  { key: 'endpoints', label: 'Endpoints' },
  { key: 'knowledge_bases', label: 'Knowledge Bases' },
  { key: 'log_retention_days', label: 'Logs & Recording retention', format: v => `${v} days` },
];

const ADDITIONAL_FEATURES: {
  label: string;
  plans: Record<string, boolean>;
}[] = [
  {
    label: 'Playground UI',
    plans: { free: true, pro: true, enterprise: true },
  },
  {
    label: 'Voice Assistants',
    plans: { free: true, pro: true, enterprise: true },
  },
  {
    label: 'Knowledge Base (RAG)',
    plans: { free: true, pro: true, enterprise: true },
  },
  {
    label: 'Conversation Logs & Recording',
    plans: { free: true, pro: true, enterprise: true },
  },
  {
    label: 'Custom Integrations',
    plans: { free: false, pro: true, enterprise: true },
  },
  {
    label: 'Telemetry & Analytics',
    plans: { free: false, pro: true, enterprise: true },
  },
  {
    label: 'Priority Support',
    plans: { free: false, pro: true, enterprise: true },
  },
  {
    label: 'Custom SLA',
    plans: { free: false, pro: false, enterprise: true },
  },
  {
    label: 'Dedicated Infrastructure',
    plans: { free: false, pro: false, enterprise: true },
  },
];

/* ── Shared grid style ── */
const gridCols = (count: number) =>
  ({ gridTemplateColumns: `240px repeat(${count}, 1fr)` }) as const;

/* ── Section header row ── */
function SectionHeader({
  label,
  planCount,
}: {
  label: string;
  planCount: number;
}) {
  return (
    <div
      className="grid border-b border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-white/[0.04]"
      style={gridCols(planCount)}
    >
      <div className="p-3 px-6">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </span>
      </div>
      {Array.from({ length: planCount }).map((_, i) => (
        <div
          key={i}
          className="p-3 border-l border-gray-300 dark:border-gray-700"
        />
      ))}
    </div>
  );
}

export function PricingTable({
  plans,
  currentPlanSlug,
  onChangePlan,
  userId,
  organizationId,
}: PricingTableProps) {
  const handlePlanAction = (plan: BillingPlan.AsObject) => {
    // If plan has a Stripe URL, redirect to Stripe checkout
    if (plan.stripeurl) {
      const checkoutUrl = buildStripeCheckoutUrl(
        plan.stripeurl,
        plan.slug,
        userId,
        organizationId,
      );
      window.location.href = checkoutUrl;
      return;
    }
    // Otherwise fall back to direct plan change (free plan, enterprise contact)
    onChangePlan(plan.slug);
  };

  return (
    <div
      id="pricing-table"
      className="w-full border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden"
    >
      {/* ── Plan header row ── */}
      <div
        className="grid border-b border-gray-300 dark:border-gray-700"
        style={gridCols(plans.length)}
      >
        {/* Empty top-left cell */}
        <div className="p-6 border-r border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-white/[0.04]" />

        {/* Plan columns */}
        {plans.map(plan => {
          const isCurrent = plan.slug === currentPlanSlug;
          const isEnterprise = plan.slug === 'enterprise';

          return (
            <div
              key={plan.id}
              className="p-6 border-r border-gray-300 dark:border-gray-700 last:border-r-0"
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {plan.name}
                </h3>
                {isCurrent && (
                  <Tag type="blue" size="sm">
                    Current
                  </Tag>
                )}
              </div>

              <div className="mb-5 min-h-[56px]">
                {isEnterprise ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Custom pricing for your organization
                  </p>
                ) : plan.pricemonthly === 0 ? (
                  <>
                    <p className="text-3xl font-light tabular-nums tracking-tight text-gray-900 dark:text-gray-100">
                      $0
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {plan.description || 'Get started with the basics'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-light tabular-nums tracking-tight text-gray-900 dark:text-gray-100">
                        {formatPrice(plan.pricemonthly, plan.currency)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        /month
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {plan.description || `Everything in Free, plus more`}
                    </p>
                  </>
                )}
              </div>

              <div>
                {isCurrent ? (
                  <PrimaryButton size="md" type="button" disabled>
                    Current plan
                  </PrimaryButton>
                ) : isEnterprise ? (
                  <PrimaryButton
                    size="md"
                    type="button"
                    renderIcon={Chat}
                    onClick={() => handlePlanAction(plan)}
                  >
                    Talk to us
                  </PrimaryButton>
                ) : plan.pricemonthly === 0 ? (
                  <PrimaryButton
                    size="md"
                    type="button"
                    renderIcon={ArrowRight}
                    onClick={() => handlePlanAction(plan)}
                  >
                    Start your free trial
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    size="md"
                    type="button"
                    renderIcon={ArrowRight}
                    onClick={() => handlePlanAction(plan)}
                  >
                    Upgrade to {plan.name}
                  </PrimaryButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quotas section ── */}
      <SectionHeader label="Quotas" planCount={plans.length} />

      {QUOTAS.map(quota => (
        <div
          key={quota.key}
          className="grid border-b border-gray-300 dark:border-gray-700"
          style={gridCols(plans.length)}
        >
          <div className="p-3 px-6 text-sm text-gray-600 dark:text-gray-400">
            {quota.label}
          </div>
          {plans.map(plan => {
            const q = plan.quotasList?.find(
              item => item.resourcetype === quota.key,
            );
            let value: string | null = null;
            if (q) {
              if (q.quotalimit === -1) value = 'Unlimited';
              else if (quota.format) value = quota.format(q.quotalimit);
              else value = String(q.quotalimit);
            }
            return (
              <div
                key={plan.id}
                className="p-3 px-6 text-sm border-l border-gray-300 dark:border-gray-700"
              >
                {value !== null ? (
                  <span className="text-gray-900 dark:text-gray-200">
                    {value}
                  </span>
                ) : (
                  <span className="text-gray-300 dark:text-gray-600">—</span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* ── Features section ── */}
      <SectionHeader label="Features" planCount={plans.length} />

      {ADDITIONAL_FEATURES.map(feature => (
        <div
          key={feature.label}
          className="grid border-b border-gray-300 dark:border-gray-700 last:border-b-0"
          style={gridCols(plans.length)}
        >
          <div className="p-3 px-6 text-sm text-gray-600 dark:text-gray-400">
            {feature.label}
          </div>
          {plans.map(plan => {
            const included = feature.plans[plan.slug] || false;
            return (
              <div
                key={plan.id}
                className="p-3 px-6 border-l border-gray-300 dark:border-gray-700"
              >
                {included ? (
                  <Checkmark size={20} className="text-green-600 dark:text-green-400" />
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
