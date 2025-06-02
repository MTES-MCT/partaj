import React from 'react';
import { Referral, ReferralState } from 'types';
import { ReferralReport } from '../../../ReferralReport';
import { Conversation } from '../../../ReferralReport/Conversation/Conversation';
import { DownloadButton } from '../../../buttons/DownloadButton';

interface TabReportProps {
  referral: Referral;
}

export const TabReport: React.FC<TabReportProps> = ({ referral }) => {
  return (
    <>
      {referral.state !== ReferralState.SPLITTING && (
        <>
          <div className="flex space-x-4 float-right mb-8">
            <DownloadButton
              referralId={String(referral!.id)}
              type={referral.ff_new_form === 1 ? 'new' : 'standard'}
            />
          </div>
          <ReferralReport />
        </>
      )}
      <Conversation />
    </>
  );
};
