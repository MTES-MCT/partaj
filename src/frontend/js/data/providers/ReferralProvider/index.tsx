import * as Sentry from '@sentry/react';
import React, { ReactNode, useState } from 'react';

import { appData } from 'appData';
import { Referral, ReferralSection } from 'types';
import { Nullable } from 'types/utils';
import { useAsyncEffect } from 'utils/useAsyncEffect';

export const ReferralContext = React.createContext<{
  referral: Nullable<Referral>;
  group: ReferralSection[];
  refetch: any;
  setReferral: Function;
}>({
  setReferral: () => {
    return;
  },
  referral: null,
  group: [],
  refetch: () => {
    return;
  },
});

export const ReferralProvider = ({
  children,
  referralId,
}: {
  children: ReactNode;
  referralId: string;
}) => {
  const [referral, setReferral] = useState<Nullable<Referral>>(null);
  const [group, setGroup] = useState<ReferralSection[]>([]);
  const [update, setUpdate] = useState<number>(0);

  const refetch = () => {
    setUpdate((prev: number) => {
      return prev + 1;
    });
  };

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

    const groupResponse = await fetch(`/api/referrals/${referralId}/group/`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!groupResponse.ok) {
      Sentry.captureException(
        new Error('Failed to get relationships in ReferralDetails.'),
        {
          extra: {
            code: groupResponse.status,
            body: groupResponse.body,
          },
        },
      );
      return;
    }

    const currentGroup: ReferralSection[] = await groupResponse.json();

    setGroup(currentGroup);
  }, [referralId, update]);

  const { Provider } = ReferralContext;

  return (
    <Provider value={{ referral, refetch, setReferral, group }}>
      {children}
    </Provider>
  );
};
