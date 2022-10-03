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
      <Conversation />
    </>
  );
};
