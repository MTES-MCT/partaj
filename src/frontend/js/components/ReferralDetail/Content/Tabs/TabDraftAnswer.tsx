import React from 'react';
import { Referral } from 'types';
import { DownloadReferralButton } from '../../Buttons/DowloadReferralBtn';
import { ReferralConversation } from '../../../ReferralConversation';
import { ReferralDraftAnswerV2 } from '../../../ReferralDraftAnswerV2';

interface TabDraftAnswersProps {
  referral: Referral;
}

export const TabDraftAnswer: React.FC<TabDraftAnswersProps> = ({
  referral,
}) => {
  return (
    <>
      <DownloadReferralButton referralId={String(referral!.id)} />
      <ReferralDraftAnswerV2 />
      <ReferralConversation />
    </>
  );
};
