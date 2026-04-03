import { lazyLoad } from '@/utils/loadable';
import { PageLoader } from '@/app/components/loader/page-loader';

export const BillingPage = lazyLoad(
  () => import('./billing'),
  module => module.BillingPage,
  {
    fallback: <PageLoader />,
  },
);

export const BillingCallbackPage = lazyLoad(
  () => import('./callback'),
  module => module.BillingCallbackPage,
  {
    fallback: <PageLoader />,
  },
);
