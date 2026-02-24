import React, { useContext } from 'react';
import { Referral } from '../../../../types';
import { useSubReferral } from '../../../../data/providers/SubReferralProvider';
import { CancelSplitButton } from '../../../buttons/CancelSplitButton';
import { ConfirmSplitButton } from '../../../buttons/ConfirmSplitButton';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';

export const SubReferralFooter: ({
  referral,
}: {
  referral: Referral;
}) => JSX.Element = ({ referral }: { referral: Referral }) => {
  const { subFormState } = useSubReferral();
  const { setReferral } = useContext(ReferralContext);

  return (
    <div className="w-full flex items-center justify-between pt-8">
      <CancelSplitButton referral={referral} />
      <ConfirmSplitButton
        referralId={referral.id}
        subTitle={subFormState['sub_title'].currentValue}
        subQuestion={subFormState['sub_question'].currentValue}
        onSuccess={(referral: Referral) => {
          setReferral(referral);
        }}
      />
    </div>
  );
};
