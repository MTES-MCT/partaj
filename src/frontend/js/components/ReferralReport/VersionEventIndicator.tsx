import React from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
  useIntl,
} from 'react-intl';

import { ReferralReportVersion, ReportEvent, ReportEventVerb } from 'types';
import { getUserFullname } from 'utils/user';
import { commonMessages } from '../../const/translations';

const messages = defineMessages({
  [ReportEventVerb.REQUEST_CHANGE]: {
    defaultMessage: 'Change requested by { userName } ({ roleName })',
    description: 'Version request change event indicator message.',
    id: 'components.VersionEventIndicator.requestChange',
  },
  [ReportEventVerb.REQUEST_VALIDATION]: {
    defaultMessage:
      '{ userName } request validation to { roleName } of { unitName }',
    description: 'Version request validation event indicator message.',
    id: 'components.VersionEventIndicator.requestValidation',
  },
  [ReportEventVerb.VERSION_VALIDATED]: {
    defaultMessage: 'Validated by { userName } ({ roleName })',
    description: 'Version validated event indicator message.',
    id: 'components.VersionEventIndicator.versionValidated',
  },
});

interface VersionEventIndicatorProps {
  version: ReferralReportVersion;
  event: ReportEvent;
  isActive: boolean;
}

type VersionEventVerb = Exclude<
  ReportEventVerb,
  | ReportEventVerb.MESSAGE
  | ReportEventVerb.NEUTRAL
  | ReportEventVerb.VERSION_ADDED
  | ReportEventVerb.VERSION_UPDATED
>;

const eventStyle = {
  [ReportEventVerb.NEUTRAL]: {
    style: 'text-gray-400',
  },
  [ReportEventVerb.VERSION_VALIDATED]: {
    style: 'text-success-600 border-success-600',
  },
  [ReportEventVerb.REQUEST_VALIDATION]: {
    style: 'text-gold-600 border-gold-600',
  },
  [ReportEventVerb.REQUEST_CHANGE]: {
    style: 'text-danger-600 border-danger-600',
  },
};

export const VersionEventIndicator = ({
  version,
  event,
  isActive,
}: VersionEventIndicatorProps) => {
  let message: React.ReactNode;
  const intl = useIntl();

  const getStyle = (verb: string) => {
    return eventStyle.hasOwnProperty(verb) && isActive
      ? eventStyle[verb as VersionEventVerb].style
      : eventStyle[ReportEventVerb.NEUTRAL].style;
  };

  switch (event.verb) {
    case ReportEventVerb.REQUEST_VALIDATION:
      message = (
        <FormattedMessage
          {...messages[event.verb]}
          values={{
            userName: getUserFullname(event.user),
            roleName: intl.formatMessage(
              commonMessages[event.metadata.receiver_role],
            ),
            unitName: event.metadata.receiver_unit.name,
          }}
        />
      );
      break;
    case ReportEventVerb.VERSION_VALIDATED:
    case ReportEventVerb.REQUEST_CHANGE:
      message = (
        <FormattedMessage
          {...messages[event.verb]}
          values={{
            userName: getUserFullname(event.user),
            roleName: intl.formatMessage(
              commonMessages[event.metadata.sender_role],
            ),
          }}
        />
      );
      break;
  }

  return (
    <p
      className={
        getStyle(event.verb) + ' text-sm py-0 px-2 w-fit rounded-full border'
      }
    >
      {message}
      {' le '}
      <FormattedDate
        year="2-digit"
        month="2-digit"
        day="2-digit"
        value={event.created_at}
      />
      {' à '}
      <FormattedTime value={event.created_at} />
    </p>
  );
};
