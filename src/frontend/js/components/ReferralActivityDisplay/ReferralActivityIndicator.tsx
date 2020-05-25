import React from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
} from 'react-intl';

import { ReferralActivity, ReferralActivityVerb } from 'types';
import { ContextProps } from 'types/context';
import { getUserFullname } from 'utils/user';
import { ReferralActivityIndicatorLook } from './ReferralActivityIndicatorLook';

interface ReferralActivityIndicatorProps {
  activity: ReferralActivity;
}

const messages = defineMessages({
  [ReferralActivityVerb.ANSWERED]: {
    defaultMessage: '{ actorName } answered this referral',
    description: 'Activity indicator message for a referral answer.',
    id: 'components.ReferralActivityIndicator.answered',
  },
  [ReferralActivityVerb.ASSIGNED]: {
    defaultMessage: '{ actorName } assigned { assigneeName } to this referral',
    description: 'Activity indicator message for a referral assignment.',
    id: 'components.ReferralActivityIndicator.assigned',
  },
  [ReferralActivityVerb.CREATED]: {
    defaultMessage: '{ actorName } requested a new referral',
    description: 'Activity indicator message for a referral creation.',
    id: 'components.ReferralActivityIndicator.created',
  },
  timeIndicator: {
    defaultMessage: 'On {date}, {time}',
    description: 'Time inficator for any referral activity',
    id: 'components.ReferralActivityIndicator.timeIndicator',
  },
});

export const ReferralActivityIndicator = ({
  activity,
  context,
}: ReferralActivityIndicatorProps & ContextProps) => {
  let message: JSX.Element;
  switch (activity.verb) {
    case ReferralActivityVerb.ANSWERED:
    case ReferralActivityVerb.CREATED:
      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{ actorName: getUserFullname(activity.actor) }}
        />
      );
      break;

    case ReferralActivityVerb.ASSIGNED:
      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{
            actorName: getUserFullname(activity.actor),
            assigneeName: getUserFullname(activity.item_content_object),
          }}
        />
      );
      break;
  }

  return (
    <ReferralActivityIndicatorLook
      context={context}
      topLine={message}
      bottomLine={
        <FormattedMessage
          {...messages.timeIndicator}
          values={{
            date: (
              <FormattedDate
                year="numeric"
                month="long"
                day="numeric"
                value={activity.created_at}
              />
            ),
            time: <FormattedTime value={activity.created_at} />,
          }}
        />
      }
    />
  );
};
