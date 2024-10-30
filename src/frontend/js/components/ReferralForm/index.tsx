import React, { useContext } from 'react';
import { NewReferralForm } from './NewForm';
import { OldReferralForm } from './OldReferralForm';
import { ReferralContext } from '../../data/providers/ReferralProvider';

export const ReferralForm: React.FC = () => {
  const { referral } = useContext(ReferralContext);

  return (
    <>
      {referral && (
        <>{referral.ff_new_from ? <NewReferralForm /> : <OldReferralForm />}</>
      )}
    </>
  );
};
