import React from 'react';
import { useParams, useRouteMatch } from 'react-router-dom';

import { ReferralTabs } from './Content/ReferralTabs';
import { ReferralContent } from './Content/ReferralContent';
import { ReferralHeader } from './Header/ReferralHeader';
import { ReferralProvider } from '../../data/providers/ReferralProvider';
import { useTitle } from 'utils/useTitle';

export interface ReferralDetailRouteParams {
  referralId: string;
}

export const ReferralDetail: any = () => {
  const { path, url } = useRouteMatch();
  const { referralId } = useParams<ReferralDetailRouteParams>();
  useTitle('referralDetails', { referralId });

  return (
    <section className="max-w-4xl container mx-auto flex-grow flex flex-col space-y-8 pb-8">
      <ReferralProvider referralId={referralId}>
        <ReferralHeader />
        <ReferralTabs />
        <ReferralContent url={url} path={path} />
      </ReferralProvider>
    </section>
  );
};
