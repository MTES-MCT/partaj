import React from 'react';
import { Referral } from 'types';
import { ReferralReport } from '../../../ReferralReport';
import { Conversation } from '../../../ReferralReport/Conversation/Conversation';
import { DownloadReferralButton } from '../../../buttons/DowloadReferralBtn';
import { DownloadNewReferralButton } from '../../../buttons/DowloadNewReferralBtn';

interface TabReportProps {
  referral: Referral;
}

export const TabReport: React.FC<TabReportProps> = ({ referral }) => {
  return (
    <>
      <div className="flex space-x-4 float-right mb-8">
        {referral.ff_new_form === 0 && (
          <DownloadReferralButton referralId={String(referral!.id)} />
        )}
        {referral.ff_new_form === 1 && (
          <DownloadNewReferralButton referralId={String(referral!.id)} />
        )}
      </div>
      <ReferralReport />
      <Conversation />
    </>
  );
};
