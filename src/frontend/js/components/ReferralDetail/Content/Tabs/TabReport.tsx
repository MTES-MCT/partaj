import React from 'react';
import { Referral, ReferralState, ReportEventType } from 'types';
import { ReferralReport } from '../../../ReferralReport';
import { DownloadButton } from '../../../buttons/DownloadButton';
import { ReferralEvents } from '../../../ReferralEvents';

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
          <ReferralEvents referral={referral} type={ReportEventType.VERSION} />
        </>
      )}
    </>
  );
};
