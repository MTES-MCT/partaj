import { useState } from 'react';

import { Referral } from 'types';
import { Nullable } from 'types/utils';
import { handle } from 'utils/errors';
import { useAsyncEffect } from 'utils/useAsyncEffect';

export const useReferral = (referralId: Referral['id']) => {
  const [referral, setReferral] = useState<Nullable<Referral>>(null);

  useAsyncEffect(async () => {
    const response = await fetch(`/api/referrals/${referralId}/`);
    if (!response.ok) {
      return handle(new Error('Failed to get referral in useReferral.'));
    }
    const incomingReferral: Referral = await response.json();
    setReferral(incomingReferral);
  }, []);

  return { referral };
};
