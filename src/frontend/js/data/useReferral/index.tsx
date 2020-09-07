import * as Sentry from '@sentry/react';
import { useState } from 'react';

import { Referral } from 'types';
import { Context } from 'types/context';
import { Nullable } from 'types/utils';
import { useAsyncEffect } from 'utils/useAsyncEffect';

export const useReferral = (referralId: Referral['id'], context: Context) => {
  const [referral, setReferral] = useState<Nullable<Referral>>(null);

  useAsyncEffect(async () => {
    const response = await fetch(`/api/referrals/${referralId}/`, {
      headers: {
        Authorization: `Token ${context.token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      Sentry.captureException(
        new Error('Failed to get referral in useReferral.'),
        { extra: { code: response.status, body: response.body } },
      );
      return;
    }
    const incomingReferral: Referral = await response.json();
    setReferral(incomingReferral);
  }, []);

  return { referral, setReferral };
};
