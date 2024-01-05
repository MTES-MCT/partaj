import React from 'react';

import { ReportEvent, ReportEventVerb, User, UserLite } from '../../../types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Nullable } from '../../../types/utils';
import { commonMessages } from '../../../const/translations';

const eventMessages = defineMessages({
  [ReportEventVerb.VERSION_ADDED]: {
    defaultMessage: 'added new version {version}',
    description: `version added event text`,
    id: 'components.EventMessage.versionAdded',
  },
  [ReportEventVerb.VERSION_UPDATED]: {
    defaultMessage: 'updated version {version}',
    description: `version updated event text`,
    id: 'components.EventMessage.versionUpdated',
  },
  [ReportEventVerb.REQUEST_VALIDATION]: {
    defaultMessage:
      'request validation on version {version} at {level} level for unit {unit}',
    description: `request validation event text`,
    id: 'components.EventMessage.requestValidation',
  },
  [ReportEventVerb.REQUEST_CHANGE]: {
    defaultMessage: '({ level }) request change on version {version}',
    description: `request change event text`,
    id: 'components.EventMessage.requestChange',
  },
  [ReportEventVerb.VERSION_VALIDATED]: {
    defaultMessage: '({level}) validated version {version}',
    description: `version validated event text`,
    id: 'components.EventMessage.validatedVersion',
  },
  deletedUser: {
    defaultMessage: '"deleted user"',
    description: 'name of deleted user.',
    id: 'components.EventMessage.deletedUser',
  },
});
interface EventMessageProps {
  username: string;
  metadata: Nullable<ReportEvent['metadata']> | undefined;
  verb: ReportEventVerb;
  version: Nullable<number>;
  color: string;
}

export const EventMessage = ({
  username,
  metadata,
  verb,
  version,
  color,
}: EventMessageProps) => {
  const intl = useIntl();
  let message: React.ReactNode;
  switch (verb) {
    case ReportEventVerb.REQUEST_VALIDATION:
      message = metadata ? (
        <FormattedMessage
          {...eventMessages[verb]}
          values={{
            unit: metadata.receiver_unit_name,
            level: intl.formatMessage(commonMessages[metadata.receiver_role]),
            version: version,
          }}
        />
      ) : (
        <></>
      );
      break;
    case ReportEventVerb.REQUEST_CHANGE:
    case ReportEventVerb.VERSION_VALIDATED:
      message = metadata ? (
        <FormattedMessage
          {...eventMessages[verb]}
          values={{
            version: version,
            level: intl.formatMessage(commonMessages[metadata.sender_role]),
          }}
        />
      ) : (
        <></>
      );
      break;
    case ReportEventVerb.VERSION_ADDED:
    case ReportEventVerb.VERSION_UPDATED:
      message = (
        <FormattedMessage
          {...eventMessages[verb]}
          values={{
            version: version,
          }}
        />
      );
      break;
    case ReportEventVerb.MESSAGE:
      message = '';
      break;
  }

  return (
    <div className="flex items-start leading-5">
      <span className="font-medium flex-shrink-0">{username}</span>
      <span className={`${color} italic text-sm pl-1`}>{message}</span>
    </div>
  );
};
