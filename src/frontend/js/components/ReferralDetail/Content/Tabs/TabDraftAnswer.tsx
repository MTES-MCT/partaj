import React from 'react';
import { Referral } from 'types';
import { DownloadReferralButton } from '../../Buttons/DowloadReferralBtn';
import { ReferralConversation } from '../../../ReferralConversation';
import { ReferralDraftAnswerV2 } from '../../../ReferralDraftAnswerV2';
import { useUIDSeed } from 'react-uid';

interface TabDraftAnswersProps {
  referral: Referral;
}

export const TabDraftAnswer: React.FC<TabDraftAnswersProps> = ({
  referral,
}) => {
  const seed = useUIDSeed();

  return (
    <article
      className="w-full lg:max-w-4xl border-gray-400 p-10 mt-8 mb-8 rounded-xl border"
      aria-labelledby={seed('referral-answer')}
    >
      <div className="flex space-x-4 float-right">
        <DownloadReferralButton referralId={String(referral!.id)} />
      </div>
      <ReferralDraftAnswerV2 />
      <ReferralConversation />
    </article>
  );
};
