import React from 'react';
import { Referral, ReferralState } from 'types';
import { ReferralAppendices } from '../../../ReferralAppendices';

interface TabAppendicesProps {
  referral: Referral;
}

export const TabAppendices: React.FC<TabAppendicesProps> = ({ referral }) => {
  return (
    <>
      {![ReferralState.SPLITTING, ReferralState.RECEIVED_SPLITTING].includes(
        referral.state,
      ) && (
        <>
          <ReferralAppendices />
        </>
      )}
    </>
  );
};
