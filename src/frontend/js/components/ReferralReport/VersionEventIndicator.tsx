import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import {
  ReferralReportVersion,
  ReportEvent,
  ReportEventVerb,
  UnitMembershipRole,
} from 'types';
import { getUserFullname } from 'utils/user';
import { commonMessages } from '../../const/translations';
import { IconColor } from '../Icons';

const messages = defineMessages({
  [ReportEventVerb.REQUEST_CHANGE]: {
    defaultMessage:
      '{ userName } ({ roleName }) request change to { authorName }',
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
    style: 'bg-gray-100 text-gray-400',
  },
  [ReportEventVerb.VERSION_VALIDATED]: {
    style: 'bg-success-200',
  },
  [ReportEventVerb.REQUEST_VALIDATION]: {
    style: 'bg-warning-200',
  },
  [ReportEventVerb.REQUEST_CHANGE]: {
    style: 'bg-danger-200',
  },
};

export const VersionEventIndicator = ({
  version,
  event,
  isActive,
}: VersionEventIndicatorProps) => {
  let message: React.ReactNode;
  const intl = useIntl();

  const getBackground = (verb: string) => {
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
    case ReportEventVerb.REQUEST_CHANGE:
      message = (
        <FormattedMessage
          {...messages[event.verb]}
          values={{
            userName: getUserFullname(event.user),
            roleName: intl.formatMessage(
              commonMessages[event.metadata.sender_role],
            ),
            authorName: getUserFullname(version.created_by),
          }}
        />
      );
      break;
  }

  return (
    <p className={getBackground(event.verb) + ' text-sm py-1 px-2 w-fit'}>
      {message}
    </p>
  );
};
