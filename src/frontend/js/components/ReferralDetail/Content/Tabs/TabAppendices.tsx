import React from 'react';
import { Referral, ReferralState, ReportEventType } from 'types';
import { ReferralAppendices } from '../../../ReferralAppendices';
import { useReportEvents } from '../../../../data';
import { result } from 'lodash-es';
import { Message } from '../../../ReferralReport/Conversation/Message';
import { HistoryIcon } from '../../../Icons';
import { Title, TitleType } from '../../../text/Title';
import { ReferralEvents } from '../../../ReferralEvents';

interface TabAppendicesProps {
  referral: Referral;
}

export const TabAppendices: React.FC<TabAppendicesProps> = ({ referral }) => {
  return (
    <>
      {![ReferralState.SPLITTING, ReferralState.RECEIVED_SPLITTING].includes(
        referral.state,
      ) && (
        <>
          <ReferralAppendices />
          <ReferralEvents referral={referral} type={ReportEventType.APPENDIX} />
        </>
      )}
    </>
  );
};
