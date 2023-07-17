import React from 'react';

import { ReportEvent, ReportEventVerb, User, UserLite } from '../../../types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { getUserFullname } from '../../../utils/user';
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
    defaultMessage: 'request change on version {version}',
    description: `request change event text`,
    id: 'components.EventMessage.requestChange',
  },
  [ReportEventVerb.VERSION_VALIDATED]: {
    defaultMessage: 'validated version {version}',
    description: `version validated event text`,
    id: 'components.EventMessage.validatedVersion',
  },
  deletedUser: {
    defaultMessage: 'Deleted user',
    description: `deleted user text`,
    id: 'components.EventMessage.deletedUser',
  },
});
interface EventMessageProps {
  user: UserLite | Nullable<User>;
  metadata: Nullable<ReportEvent['metadata']> | undefined;
  verb: ReportEventVerb;
  version: Nullable<number>;
}

export const EventMessage = ({
  user,
  metadata,
  verb,
  version,
}: EventMessageProps) => {
  const intl = useIntl();
  const userName = user
    ? getUserFullname(user)
    : intl.formatMessage(eventMessages.deletedUser);

  let message: React.ReactNode;
  switch (verb) {
    case ReportEventVerb.REQUEST_VALIDATION:
      message = metadata ? (
        <FormattedMessage
          {...eventMessages[verb]}
          values={{
            unit: metadata.receiver_unit.name,
            level: intl.formatMessage(commonMessages[metadata.receiver_role]),
            version: version,
          }}
        />
      ) : (
        <></>
      );
      break;
    case ReportEventVerb.VERSION_ADDED:
    case ReportEventVerb.VERSION_UPDATED:
    case ReportEventVerb.REQUEST_CHANGE:
    case ReportEventVerb.VERSION_VALIDATED:
      message = '';
      break;
    case ReportEventVerb.MESSAGE:
      message = '';
      break;
  }

  return (
    <span>
      {userName} {message}
    </span>
  );
};
