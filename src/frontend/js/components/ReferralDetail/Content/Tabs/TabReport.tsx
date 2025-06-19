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
      {![ReferralState.SPLITTING, ReferralState.RECEIVED_SPLITTING].includes(
        referral.state,
      ) && (
        <>
          <div className="flex justify-end">
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
