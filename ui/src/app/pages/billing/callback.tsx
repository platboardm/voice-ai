import React, { useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from '@/app/components/helmet';
import {
  ServiceError,
  UpdateSubscription,
  UpdateSubscriptionResponse,
} from '@rapidaai/react';
import toast from 'react-hot-toast/headless';
import { useRapidaStore } from '@/hooks';
import { useCredential } from '@/hooks/use-credential';
import { connectionConfig } from '@/configs';
import { Loading } from '@carbon/react';

export function BillingCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useRapidaStore();
  const [userId, token] = useCredential();
  const hasProcessed = useRef(false);

  const planSlug = searchParams.get('plan_slug');

  const confirmSubscription = useCallback(() => {
    if (!planSlug || hasProcessed.current) return;
    hasProcessed.current = true;

    showLoader();
    UpdateSubscription(
      connectionConfig,
      planSlug,
      { authorization: token, 'x-auth-id': userId },
      (err: ServiceError | null, res: UpdateSubscriptionResponse | null) => {
        hideLoader();
        if (err) {
          toast.error('Unable to confirm your subscription. Please try again.');
          navigate('/billing', { replace: true });
          return;
        }
        if (res?.getSuccess()) {
          toast.success('Your plan has been updated successfully!');
        } else {
          const errorMessage = res?.getError();
          if (errorMessage) toast.error(errorMessage.getHumanmessage());
          else toast.error('Unable to confirm subscription.');
        }
        navigate('/billing', { replace: true });
      },
    );
  }, [planSlug, token, userId]);

  useEffect(() => {
    confirmSubscription();
  }, [confirmSubscription]);

  return (
    <>
      <Helmet title="Processing Payment" />
      <div className="flex flex-col items-center justify-center h-full w-full gap-4">
        <Loading withOverlay={false} description="Processing your payment..." />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Confirming your subscription, please wait...
        </p>
      </div>
    </>
  );
}
