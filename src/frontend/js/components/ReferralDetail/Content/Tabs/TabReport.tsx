import React from 'react';
import { Referral } from 'types';
import { ReferralReport } from '../../../ReferralReport';
import { Conversation } from '../../../ReferralReport/Conversation/Conversation';
import { DownloadReferralButton } from '../../../buttons/DowloadReferralBtn';

interface TabReportProps {
  referral: Referral;
}

export const TabReport: React.FC<TabReportProps> = ({ referral }) => {
  return (
    <>
      <div className="flex space-x-4 float-right mb-8">
        <DownloadReferralButton referralId={String(referral!.id)} />
      </div>
      <ReferralReport />
      <div className="fullwidth flex align justify-center m-4">
        <div className="w-12 h-1 border border-gray-300 bg-gray-300">{''}</div>
      </div>
      <Conversation />
    </>
  );
};
