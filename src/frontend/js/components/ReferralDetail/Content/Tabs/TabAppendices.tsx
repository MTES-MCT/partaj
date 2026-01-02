import React from 'react';
import { Referral, ReferralState, ReportEventType } from 'types';
import { ReferralAppendices } from '../../../ReferralAppendices';
import { useReportEvents } from '../../../../data';
import { result } from 'lodash-es';
import { Message } from '../../../ReferralReport/Conversation/Message';
import { HistoryIcon } from '../../../Icons';
import { Title, TitleType } from '../../../text/Title';

interface TabAppendicesProps {
  referral: Referral;
}

export const TabAppendices: React.FC<TabAppendicesProps> = ({ referral }) => {
  const { data, status } = useReportEvents({
    report: String(referral.report!.id),
    type: ReportEventType.APPENDIX,
  });

  return (
    <>
      {![ReferralState.SPLITTING, ReferralState.RECEIVED_SPLITTING].includes(
        referral.state,
      ) && (
        <>
          <ReferralAppendices />
          {status === 'success' && data && data.results.length > 0 && (
            <div className="flex flex-col px-6 space-y-4">
              <div className="flex space-x-2 items-center">
                <HistoryIcon className={'w-8 h-8'} />
                <h4 className="font-medium text-xl m-0">
                  {' '}
                  Dernières activités{' '}
                </h4>
              </div>
              <div>
                {data &&
                  data.results
                    .slice(0, 3)
                    .map((event) => (
                      <Message
                        key={event.id}
                        message={event.content}
                        version={event.version}
                        appendix={event.appendix}
                        verb={event.verb}
                        user={event.user}
                        created_at={event.created_at}
                        notifications={event.notifications}
                        metadata={event.metadata}
                      />
                    ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
