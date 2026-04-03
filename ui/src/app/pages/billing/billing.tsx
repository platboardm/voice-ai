import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from '@/app/components/helmet';
import { DescriptiveHeading } from '@/app/components/heading/descriptive-heading';
import {
  ServiceError,
  GetAllPlans,
  GetSubscription,
  UpdateSubscription,
  GetAllPlansResponse,
  GetSubscriptionResponse,
  UpdateSubscriptionResponse,
  BillingPlan,
  BillingSubscription,
} from '@rapidaai/react';
import toast from 'react-hot-toast/headless';
import { useRapidaStore } from '@/hooks';
import { useCredential, useCurrentCredential } from '@/hooks/use-credential';
import { connectionConfig } from '@/configs';
import { UpgradeAlert } from './upgrade-alert';
import { UsageOverview } from './usage-overview';
import { PricingTable } from './pricing-table';

export function BillingPage() {
  const [plans, setPlans] = useState<BillingPlan.AsObject[]>([]);
  const [subscription, setSubscription] =
    useState<BillingSubscription.AsObject | null>(null);
  const { showLoader, hideLoader } = useRapidaStore();
  const [userId, token] = useCredential();
  const { organizationId } = useCurrentCredential();

  const authHeader = {
    authorization: token,
    'x-auth-id': userId,
  };

  const afterGetAllPlans = useCallback(
    (err: ServiceError | null, res: GetAllPlansResponse | null) => {
      if (err) {
        toast.error('Unable to fetch billing plans.');
        return;
      }
      if (res?.getSuccess()) {
        setPlans(res.getDataList().map(p => p.toObject()));
      } else {
        const errorMessage = res?.getError();
        if (errorMessage) toast.error(errorMessage.getHumanmessage());
      }
    },
    [],
  );

  const afterGetSubscription = useCallback(
    (err: ServiceError | null, res: GetSubscriptionResponse | null) => {
      hideLoader();
      if (err) {
        return;
      }
      if (res?.getSuccess()) {
        const data = res.getData();
        if (data) setSubscription(data.toObject());
      }
    },
    [],
  );

  const onChangePlan = useCallback(
    (planSlug: string) => {
      showLoader();
      UpdateSubscription(
        connectionConfig,
        planSlug,
        authHeader,
        (err: ServiceError | null, res: UpdateSubscriptionResponse | null) => {
          hideLoader();
          if (err) {
            toast.error(
              'Unable to process your request. Please try again later.',
            );
            return;
          }
          if (res?.getSuccess()) {
            toast.success('Your plan has been updated successfully.');
            const data = res.getData();
            if (data) setSubscription(data.toObject());
          } else {
            const errorMessage = res?.getError();
            if (errorMessage) toast.error(errorMessage.getHumanmessage());
            else toast.error('Unable to update plan. Please try again later.');
          }
        },
      );
    },
    [token, userId],
  );

  useEffect(() => {
    showLoader();
    GetAllPlans(connectionConfig, authHeader, afterGetAllPlans);
    GetSubscription(connectionConfig, authHeader, afterGetSubscription);
  }, []);

  const currentPlanSlug = subscription?.plan?.slug || 'free';
  const isFreePlan = currentPlanSlug === 'free';

  return (
    <>
      <Helmet title="Billing" />
      <div className="flex items-center justify-between py-2 px-4">
        <DescriptiveHeading
          heading="Billing & Plans"
          subheading="Manage your organization's subscription and billing."
        />
      </div>

      <div className="border-t dark:border-gray-800 px-4 py-6 space-y-8 overflow-y-auto">
        {isFreePlan && <UpgradeAlert />}

        <UsageOverview
          subscription={subscription}
          plans={plans}
          currentPlanSlug={currentPlanSlug}
        />

        <PricingTable
          plans={plans}
          currentPlanSlug={currentPlanSlug}
          onChangePlan={onChangePlan}
          userId={userId}
          organizationId={organizationId}
        />
      </div>
    </>
  );
}
