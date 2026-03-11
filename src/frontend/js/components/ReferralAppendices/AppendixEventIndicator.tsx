import React, { useContext } from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
  useIntl,
} from 'react-intl';

import {
  Referral,
  ReportAppendixEventVerb,
  ReportEvent,
  ReportEventState,
  ReportEventVerb,
} from 'types';
import { getUserFullname } from 'utils/user';
import { commonMessages } from '../../const/translations';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { referralIsOpen } from '../../utils/referral';
import { Nullable } from '../../types/utils';
import { getAppendixEventStyle } from '../../utils/styles';

const messages = defineMessages({
  [ReportAppendixEventVerb.APPENDIX_REQUEST_CHANGE]: {
    defaultMessage:
      'Change requested by { userName } ({ roleName }) - { date } { time }',
    description: 'Appendix request change event indicator message.',
    id: 'components.AppendixEventIndicator.requestChange',
  },
  [ReportAppendixEventVerb.APPENDIX_REQUEST_VALIDATION]: {
    defaultMessage:
      '{ userName } request validation to { roleName } of { unitName } - { date } { time }',
    description: 'Appendix request validation event indicator message.',
    id: 'components.AppendixEventIndicator.requestValidation',
  },
  [ReportAppendixEventVerb.APPENDIX_VALIDATED]: {
    defaultMessage:
      'Validated by { userName } ({ roleName }) - { date } { time }',
    description: 'Appendix validated event indicator message.',
    id: 'components.AppendixEventIndicator.versionValidated',
  },
});

interface AppendixEventIndicatorProps {
  event: ReportEvent;
}

export const AppendixEventIndicator = ({
  event,
}: AppendixEventIndicatorProps) => {
  let message: React.ReactNode;
  const intl = useIntl();
  const { referral } = useContext(ReferralContext);

  const getStyle = (verb: ReportEventVerb, referral: Nullable<Referral>) => {
    if (
      !referralIsOpen(referral) ||
      event.state === ReportEventState.INACTIVE
    ) {
      return getAppendixEventStyle(ReportAppendixEventVerb.NEUTRAL);
    } else {
      return getAppendixEventStyle(verb);
    }
  };

  switch (event.verb) {
    case ReportAppendixEventVerb.APPENDIX_REQUEST_VALIDATION:
      message = (
        <FormattedMessage
          {...messages[event.verb]}
          values={{
            userName: getUserFullname(event.user),
            roleName: intl.formatMessage(
              commonMessages[event.metadata.receiver_role],
            ),
            unitName: event.metadata.receiver_unit_name,
            date: (
              <FormattedDate
                year="2-digit"
                month="2-digit"
                day="2-digit"
                value={event.created_at}
              />
            ),
            time: <FormattedTime value={event.created_at} />,
          }}
        />
      );
      break;
    case ReportAppendixEventVerb.APPENDIX_VALIDATED:
    case ReportAppendixEventVerb.APPENDIX_REQUEST_CHANGE:
      message = (
        <FormattedMessage
          {...messages[event.verb]}
          values={{
            userName: getUserFullname(event.user),
            roleName: intl.formatMessage(
              commonMessages[event.metadata.sender_role],
            ),
            date: (
              <FormattedDate
                year="2-digit"
                month="2-digit"
                day="2-digit"
                value={event.created_at}
              />
            ),
            time: <FormattedTime value={event.created_at} />,
          }}
        />
      );
      break;
  }

  return (
    <div className="flex w-full space-x-1 items-center">
      <div className={`w-3 h-3 rounded-full ${getStyle(event.verb, referral)}`}>
        {' '}
      </div>
      <span
        className={` ${
          event.state === ReportEventState.OBSOLETE && !referralIsOpen(referral)
            ? 'italic text-gray-450'
            : 'text-black'
        } text-sm py-0 w-fit`}
      >
        {message}
      </span>
    </div>
  );
};
