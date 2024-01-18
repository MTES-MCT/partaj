import React from 'react';

import { ReportEvent, ReportEventVerb, User, UserLite } from '../../../types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Nullable } from '../../../types/utils';
import { commonMessages } from '../../../const/translations';
import { getEventStyle } from '../../../utils/styles';

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
}

export const EventMessage = ({
  username,
  metadata,
  verb,
  version,
}: EventMessageProps) => {
  const intl = useIntl();
  let action: React.ReactNode;
  switch (verb) {
    case ReportEventVerb.REQUEST_VALIDATION:
      action = metadata ? (
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
      action = metadata ? (
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
      action = (
        <FormattedMessage
          {...eventMessages[verb]}
          values={{
            version: version,
          }}
        />
      );
      break;
    case ReportEventVerb.MESSAGE:
      action = '';
      break;
  }

  return (
    <>
      <div
        className={`absolute w-3 h-3 rounded-full ${getEventStyle(verb)}`}
        style={{ left: '-17px', top: '3px' }}
      >
        {' '}
      </div>
      <span className="font-medium flex-shrink-0">{username}</span>
      <span className="italic text-sm pl-1">{action}</span>
    </>
  );
};
