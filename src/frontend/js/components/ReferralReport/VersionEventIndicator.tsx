import React from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
  useIntl,
} from 'react-intl';

import { appData } from 'appData';
import { ReferralReportVersion, ReportEvent, ReportEventVerb } from 'types';
import { getUserFullname, getUserFullnameOrEmail } from 'utils/user';

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
}

export const VersionEventIndicator = ({
  version,
  event,
}: VersionEventIndicatorProps) => {
  let message: React.ReactNode;
  switch (event.verb) {
    case ReportEventVerb.REQUEST_VALIDATION:
      message = (
        <FormattedMessage
          {...messages[event.verb]}
          values={{
            userName: getUserFullname(event.user),
            roleName: event.metadata.receiver_role,
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
            roleName: event.metadata.sender_role,
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
            roleName: event.metadata.sender_role,
            authorName: getUserFullname(version.created_by),
          }}
        />
      );
      break;
  }

  return <p>{message}</p>;
};
