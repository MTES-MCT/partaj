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
import { ActivityAnsweredValidations } from './ActivityAnsweredValidations';

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
  assignedSelf: {
    defaultMessage: '{ actorName } assigned themselves to this referral',
    description:
      'Activity indicator message for a referral assignment by the assignee themselves.',
    id: 'components.ReferralActivityIndicator.assignedSelf',
  },
  [ReferralActivityVerb.CREATED]: {
    defaultMessage: '{ actorName } requested a new referral',
    description: 'Activity indicator message for a referral creation.',
    id: 'components.ReferralActivityIndicator.created',
  },
  [ReferralActivityVerb.DRAFT_ANSWERED]: {
    defaultMessage: '{ actorName } created a draft answer for this referral',
    description: 'Activity indicator message for a referral answer draft.',
    id: 'components.ReferralActivityIndicator.draftAnswered',
  },
  timeIndicator: {
    defaultMessage: 'On {date}, {time}',
    description: 'Time inficator for any referral activity',
    id: 'components.ReferralActivityIndicator.timeIndicator',
  },
  [ReferralActivityVerb.UNASSIGNED]: {
    defaultMessage:
      '{ actorName } removed { assigneeName } from assignees to this referral',
    description:
      'Activity indicator message for a referral assignment removal.',
    id: 'components.ReferralActivityIndicator.unassigned',
  },
  unassignedSelf: {
    defaultMessage:
      '{ actorName } removed themselves from assignees to this referral',
    description:
      'Activity indicator for a referral assignment removal by the assignee themselves.',
    id: 'components.ReferralActivityIndicator.unassignedSelf',
  },
  [ReferralActivityVerb.VALIDATED]: {
    defaultMessage: '{ actorName } validated an answer to this referral',
    description:
      'Activity indicator message for a granted validation on a referral answer draft.',
    id: 'components.ReferralActivityIndicator.validated',
  },
  [ReferralActivityVerb.VALIDATION_DENIED]: {
    defaultMessage:
      '{ actorName } requested changes to an answer to this referral',
    description:
      'Activity indicator message for a denied validation on a referral answer draft.',
    id: 'components.ReferralActivityIndicator.validationDenied',
  },
  [ReferralActivityVerb.VALIDATION_REQUESTED]: {
    defaultMessage:
      '{ actorName } requested a validation from { validatorName } for an answer to this referral',
    description:
      'Activity indicator message for a validation request on a referral answer draft.',
    id: 'components.ReferralActivityIndicator.validationRequested',
  },
});

export const ReferralActivityIndicator = ({
  activity,
  context,
}: ReferralActivityIndicatorProps & ContextProps) => {
  let message: React.ReactNode;
  switch (activity.verb) {
    case ReferralActivityVerb.ANSWERED:
    case ReferralActivityVerb.CREATED:
    case ReferralActivityVerb.DRAFT_ANSWERED:
    case ReferralActivityVerb.VALIDATED:
    case ReferralActivityVerb.VALIDATION_DENIED:
      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{ actorName: getUserFullname(activity.actor) }}
        />
      );
      break;

    case ReferralActivityVerb.VALIDATION_REQUESTED:
      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{
            actorName: getUserFullname(activity.actor),
            validatorName: getUserFullname(
              activity.item_content_object.validator,
            ),
          }}
        />
      );
      break;

    case ReferralActivityVerb.ASSIGNED:
    case ReferralActivityVerb.UNASSIGNED:
      const messageContent =
        // Use the messages for assignment or unassignment if person A (un)assigned person B
        activity.actor.id !== activity.item_content_object.id
          ? messages[activity.verb]
          : // If person A assigned themselves pick a self (un)assignment message
          activity.verb === ReferralActivityVerb.ASSIGNED
          ? messages.assignedSelf
          : messages.unassignedSelf;
      message = (
        <FormattedMessage
          {...messageContent}
          values={{
            actorName: getUserFullname(activity.actor),
            assigneeName: getUserFullname(activity.item_content_object),
          }}
        />
      );
      break;
  }

  let messageLine2: React.ReactNode = null;
  switch (activity.verb) {
    case ReferralActivityVerb.ANSWERED:
      messageLine2 = (
        <ActivityAnsweredValidations
          answer={activity.item_content_object}
          context={context}
        />
      );
      break;
  }

  return (
    <section className="flex flex-row">
      <svg
        role="img"
        aria-hidden="true"
        className="fill-current text-gray-500 w-12 h-12 -ml-6"
      >
        <use xlinkHref={`${context.assets.icons}#icon-dot-single`} />
      </svg>
      <div>
        <div>{message}</div>
        {messageLine2 ? <div>{messageLine2}</div> : null}
        <div className="text-gray-600">
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
        </div>
      </div>
    </section>
  );
};
