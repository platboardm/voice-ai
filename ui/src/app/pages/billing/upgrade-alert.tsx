import React from 'react';
import { Notification } from '@/app/components/carbon/notification';

export function UpgradeAlert() {
  return (
    <Notification
      kind="warning"
      title="You are on the Free plan."
      subtitle="Upgrade to Pro to unlock more assistants, endpoints, users and telemetry features."
      hideCloseButton
    />
  );
}
