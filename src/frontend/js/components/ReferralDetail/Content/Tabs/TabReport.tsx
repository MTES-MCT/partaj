import React from 'react';
import { Referral } from 'types';
import { DownloadReferralButton } from '../../Buttons/DowloadReferralBtn';
import { ReferralConversation } from '../../../ReferralConversation';
import { ReferralReport } from '../../../ReferralReport';
import { useUIDSeed } from 'react-uid';

interface TabReportProps {
  referral: Referral;
}

export const TabReport: React.FC<TabReportProps> = ({ referral }) => {
  const seed = useUIDSeed();

  return (
    <article
      className="w-full lg:max-w-4xl border-gray-400 p-10 mt-8 mb-8 rounded-xl border"
      aria-labelledby={seed('referral-answer')}
    >
      <div className="flex space-x-4 float-right mb-8">
        <DownloadReferralButton referralId={String(referral!.id)} />
      </div>
      <ReferralReport />
      <ReferralConversation />
    </article>
  );
};
