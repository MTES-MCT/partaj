import React from 'react';
import { useParams, useRouteMatch } from 'react-router-dom';

import { ReferralTabs } from './Content/ReferralTabs';
import { ReferralContent } from './Content/ReferralContent';
import { ReferralHeader } from './Header/ReferralHeader';
import { ReferralProvider } from '../../data/providers/ReferralProvider';
import { useTitle } from 'utils/useTitle';
import { BaseSideModal } from './Header/BaseSideModal';
import { useFeatureFlag } from '../../data';
import { OldReferralTabs } from './Content/OldReferralTabs';

export interface ReferralDetailRouteParams {
  referralId: string;
}

export const ReferralDetail: any = () => {
  const { path, url } = useRouteMatch();
  const { referralId } = useParams<ReferralDetailRouteParams>();
  const { status, data } = useFeatureFlag('referral_tabs');

  useTitle('referralDetails', { referralId });

  return (
    <section className="w-full max-w-[936px] mx-auto flex-grow flex flex-col space-y-8 pb-8">
      <ReferralProvider referralId={referralId}>
        <ReferralHeader />
        <div className="flex flex-col px-5 space-y-8">
          {status === 'success' && (
            <>{data?.is_active ? <ReferralTabs /> : <OldReferralTabs />}</>
          )}
          <ReferralContent url={url} path={path} />
        </div>
        <BaseSideModal />
      </ReferralProvider>
    </section>
  );
};
