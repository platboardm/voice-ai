import { MissionBox } from '@/app/components/container/mission-box';
import { ProtectedBox } from '@/app/components/container/protected-box';
import { BillingPage, BillingCallbackPage } from '@/app/pages/billing';
import { Routes, Route, Outlet } from 'react-router-dom';

export function BillingRoute() {
  return (
    <Routes>
      <Route
        key="/billing"
        path="/"
        element={
          <ProtectedBox>
            <MissionBox>
              <Outlet />
            </MissionBox>
          </ProtectedBox>
        }
      >
        <Route key="/billing" path="" element={<BillingPage />} />
        <Route key="/billing/callback" path="callback" element={<BillingCallbackPage />} />
      </Route>
    </Routes>
  );
}
