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
  ReportEvent,
  ReportEventState,
  ReportEventVerb,
  ReportVersionEventVerb,
} from 'types';
import { getUserFullname } from 'utils/user';
import { commonMessages } from '../../const/translations';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { referralIsOpen } from '../../utils/referral';
import { Nullable } from '../../types/utils';
import { getEventStyle } from '../../utils/styles';

const messages = defineMessages({
  [ReportVersionEventVerb.REQUEST_CHANGE]: {
    defaultMessage:
      'Change requested by { userName } ({ roleName }) - { date } { time }',
    description: 'Version request change event indicator message.',
    id: 'components.VersionEventIndicator.requestChange',
  },
  [ReportVersionEventVerb.REQUEST_VALIDATION]: {
    defaultMessage:
      '{ userName } request validation to { roleName } of { unitName } - { date } { time }',
    description: 'Version request validation event indicator message.',
    id: 'components.VersionEventIndicator.requestValidation',
  },
  [ReportVersionEventVerb.VERSION_VALIDATED]: {
    defaultMessage:
      'Validated by { userName } ({ roleName }) - { date } { time }',
    description: 'Version validated event indicator message.',
    id: 'components.VersionEventIndicator.versionValidated',
  },
});

interface VersionEventIndicatorProps {
  event: ReportEvent;
  isActive: boolean;
}

export const VersionEventIndicator = ({
  event,
  isActive,
}: VersionEventIndicatorProps) => {
  let message: React.ReactNode;
  const intl = useIntl();
  const { referral } = useContext(ReferralContext);

  const getStyle = (verb: ReportEventVerb, referral: Nullable<Referral>) => {
    return isActive &&
      referral &&
      referralIsOpen(referral) &&
      event.state === ReportEventState.ACTIVE
      ? getEventStyle(verb)
      : '';
  };

  switch (event.verb) {
    case ReportVersionEventVerb.REQUEST_VALIDATION:
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
    case ReportVersionEventVerb.VERSION_VALIDATED:
    case ReportVersionEventVerb.REQUEST_CHANGE:
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
          event.state === ReportEventState.OBSOLETE || !referralIsOpen(referral)
            ? 'italic text-gray-450'
            : 'text-black'
        } text-sm py-0 w-fit`}
      >
        {message}
      </span>
    </div>
  );
};
