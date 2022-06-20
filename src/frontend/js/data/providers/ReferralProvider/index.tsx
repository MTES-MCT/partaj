import * as Sentry from '@sentry/react';
import React, { ReactNode, useState } from 'react';

import { appData } from 'appData';
import { Referral } from 'types';
import { Nullable } from 'types/utils';
import { useAsyncEffect } from 'utils/useAsyncEffect';

export const ReferralContext = React.createContext<{
  referral: Nullable<Referral>;
}>({ referral: null });

export const ReferralProvider = ({
  children,
  referralId,
}: {
  children: ReactNode;
  referralId: string;
}) => {
  const referral = useProvideReferral(referralId);
  const { Provider } = ReferralContext;

  return <Provider value={referral}>{children}</Provider>;
};

const useProvideReferral = (referralId: string) => {
  const [referral, setReferral] = useState<Nullable<Referral>>(null);

  useAsyncEffect(async () => {
    const response = await fetch(`/api/referrals/${referralId}/`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      Sentry.captureException(
        new Error('Failed to get referral in ReferralDetails.'),
        { extra: { code: response.status, body: response.body } },
      );
      return;
    }
    const referral: Referral = await response.json();
    setReferral(referral);
  }, []);

  return { referral };
};
