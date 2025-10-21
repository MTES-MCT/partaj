import * as Sentry from '@sentry/react';
import React, { ReactNode, useState } from 'react';

import { appData } from 'appData';
import { Referral, ReferralRelationship, ReferralSection } from 'types';
import { Nullable } from 'types/utils';
import { useAsyncEffect } from 'utils/useAsyncEffect';

export const ReferralContext = React.createContext<{
  referral: Nullable<Referral>;
  group: ReferralSection[];
  relationships: ReferralRelationship[];
  refetch: any;
  setReferral: Function;
  setRelationships: Function;
}>({
  setReferral: () => {
    return;
  },
  setRelationships: () => {
    return;
  },
  referral: null,
  group: [],
  relationships: [],
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
  const [relationships, setRelationships] = useState<ReferralRelationship[]>(
    [],
  );
  const [update, setUpdate] = useState<number>(0);
  const refetch = () => {
    setUpdate((prev: number) => {
      return prev + 1;
    });
  };

  useAsyncEffect(async () => {
    const referralResponse = await fetch(`/api/referrals/${referralId}/`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
    });

    const relationshipsResponse = await fetch(
      `/api/referralrelationships?referralId=${referralId}`,
      {
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!referralResponse.ok) {
      Sentry.captureException(
        new Error('Failed to get referral in ReferralDetails.'),
        {
          extra: { code: referralResponse.status, body: referralResponse.body },
        },
      );
      return;
    }

    const referral: Referral = await referralResponse.json();

    setReferral(referral);

    const groupResponse = await fetch(`/api/referrals/${referralId}/group/`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!groupResponse.ok) {
      Sentry.captureException(
        new Error('Failed to get group in ReferralDetails.'),
        {
          extra: {
            code: groupResponse.status,
            body: groupResponse.body,
          },
        },
      );
      return;
    }

    if (!relationshipsResponse.ok) {
      Sentry.captureException(
        new Error('Failed to get relationships in ReferralDetails.'),
        {
          extra: {
            code: relationshipsResponse.status,
            body: relationshipsResponse.body,
          },
        },
      );
      return;
    }

    const currentGroup: ReferralSection[] = await groupResponse.json();

    setGroup(currentGroup);

    const relationships: ReferralRelationship[] = await relationshipsResponse.json();

    setRelationships(relationships);
  }, [referralId, update]);

  const { Provider } = ReferralContext;

  return (
    <Provider
      value={{
        referral,
        relationships,
        setRelationships,
        refetch,
        setReferral,
        group,
      }}
    >
      {children}
    </Provider>
  );
};
