import React from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
  useIntl,
} from 'react-intl';

import { appData } from 'appData';
import { ReferralActivity, ReferralActivityVerb } from 'types';
import { getUserFullname, getUserFullnameOrEmail } from 'utils/user';
import { ActivityAnsweredValidations } from './ActivityAnsweredValidations';
import { ActivityUrgencyLevelChanged } from './ActivityUrgencyLevelChanged';
import { ActivityCloseReferral } from './ActivityCloseReferral';
import { ActivityAssignedUnit } from './ActivityAssignedUnit';

const messages = defineMessages({
  [ReferralActivityVerb.ADDED_REQUESTER]: {
    defaultMessage:
      '{ actorName } added { requesterName } as a requester on this referral',
    description:
      'Activity indicator message for a referral requester addition.',
    id: 'components.ReferralActivityIndicator.addedRequester',
  },
  [ReferralActivityVerb.ADDED_OBSERVER]: {
    defaultMessage:
      '{ actorName } added { requesterName } as a guest on this referral',
    description: 'Activity indicator message for a referral observer addition.',
    id: 'components.ReferralActivityIndicator.addedObserver',
  },
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
  [ReferralActivityVerb.ASSIGNED_UNIT]: {
    defaultMessage: '{ actorName } assigned { unit } to this referral',
    description: 'Activity indicator message for a referral unit assignment.',
    id: 'components.ReferralActivityIndicator.assignedUnit',
  },
  assignedSelf: {
    defaultMessage: '{ actorName } assigned themselves to this referral',
    description:
      'Activity indicator message for a referral assignment by the assignee themselves.',
    id: 'components.ReferralActivityIndicator.assignedSelf',
  },
  [ReferralActivityVerb.CLOSED]: {
    defaultMessage: '{ actorName } closed this referral',
    description: "Activity indicator message for a referral's close",
    id: 'components.ReferralActivityIndicator.closereferral',
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
  [ReferralActivityVerb.REMOVED_REQUESTER]: {
    defaultMessage:
      '{ actorName } removed { requesterName } from requesters for this referral',
    description: 'Activity indicator message for a referral requester removal.',
    id: 'components.ReferralActivityIndicator.removedRequester',
  },
  [ReferralActivityVerb.REMOVED_OBSERVER]: {
    defaultMessage:
      '{ actorName } removed { requesterName } from guests for this referral',
    description: 'Activity indicator message for a referral observer removal.',
    id: 'components.ReferralActivityIndicator.removedObserver',
  },
  timeIndicator: {
    defaultMessage: '{date}, {time}',
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
  [ReferralActivityVerb.UNASSIGNED_UNIT]: {
    defaultMessage: `{ actorName } removed { unit }'s assignment to this referral`,
    description:
      'Activity indicator message for a referral unit assignment removal.',
    id: 'components.ReferralActivityIndicator.unassignedUnit',
  },
  unassignedSelf: {
    defaultMessage:
      '{ actorName } removed themselves from assignees to this referral',
    description:
      'Activity indicator for a referral assignment removal by the assignee themselves.',
    id: 'components.ReferralActivityIndicator.unassignedSelf',
  },
  [ReferralActivityVerb.URGENCYLEVEL_CHANGED]: {
    defaultMessage: '{ actorName } changed the expected response date',
    description: 'Activity indicator message for a urgency level change',
    id: 'components.ReferralActivityIndicator.urgencylevelchanged',
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
  [ReferralActivityVerb.VERSION_ADDED]: {
    defaultMessage:
      '{ actorName } added a new answer version for this referral',
    description:
      'Activity indicator message for a new referral answer version added.',
    id: 'components.ReferralActivityIndicator.versionAdded',
  },
  [ReferralActivityVerb.UPDATED_TITLE]: {
    defaultMessage:
      '{ actorName } replaced the title "{ oldTitle }" with "{ newTitle }".',
    description:
      'Activity indicator message for a new referral answer version added.',
    id: 'components.ReferralActivityIndicator.updatedTitle',
  },
  [ReferralActivityVerb.TOPIC_UPDATED]: {
    defaultMessage:
      '{ actorName } changed the topic from "{ oldTopic }" to "{ newTopic }".',
    description: 'Activity indicator message for a change in the topic.',
    id: 'components.ReferralActivityIndicator.updatedTopic',
  },
  deletedUnit: {
    defaultMessage: '"deleted unit"',
    description: 'name of deleted unit.',
    id: 'components.ReferralActivityIndicator.deletedUnit',
  },
  deletedUser: {
    defaultMessage: '"deleted user"',
    description: 'name of deleted user.',
    id: 'components.ReferralActivityIndicator.deletedUser',
  },
});
interface ReferralActivityIndicatorProps {
  activity: ReferralActivity;
}

export const ReferralActivityIndicator = ({
  activity,
}: ReferralActivityIndicatorProps) => {
  const intl = useIntl();
  let itemName;
  const actorName = activity.actor
    ? getUserFullname(activity.actor)
    : intl.formatMessage(messages.deletedUser);

  let message: React.ReactNode;
  switch (activity.verb) {
    case ReferralActivityVerb.ANSWERED:
    case ReferralActivityVerb.CREATED:
    case ReferralActivityVerb.DRAFT_ANSWERED:
    case ReferralActivityVerb.VALIDATED:
    case ReferralActivityVerb.VALIDATION_DENIED:
    case ReferralActivityVerb.VERSION_ADDED:
      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{ actorName: actorName }}
        />
      );
      break;

    case ReferralActivityVerb.UPDATED_TITLE:
      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{
            actorName: actorName,
            oldTitle: activity.item_content_object.old_title,
            newTitle: activity.item_content_object.new_title,
          }}
        />
      );
      break;

    case ReferralActivityVerb.TOPIC_UPDATED:
      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{
            actorName: actorName,
            newTopic: activity.item_content_object.new_topic,
            oldTopic: activity.item_content_object.old_topic,
          }}
        />
      );
      break;

    case ReferralActivityVerb.VALIDATION_REQUESTED:
      activity.item_content_object === null
        ? (itemName = intl.formatMessage(messages.deletedUser))
        : (itemName = getUserFullnameOrEmail(
            activity.item_content_object.validator,
          ));
      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{
            actorName: actorName,
            validatorName: itemName,
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

      activity.item_content_object === null
        ? (itemName = intl.formatMessage(messages.deletedUser))
        : (itemName = getUserFullnameOrEmail(activity.item_content_object));
      message = (
        <FormattedMessage
          {...messageContent}
          values={{
            actorName: actorName,
            assigneeName: itemName,
          }}
        />
      );
      break;

    case ReferralActivityVerb.ADDED_REQUESTER:
    case ReferralActivityVerb.ADDED_OBSERVER:
    case ReferralActivityVerb.REMOVED_REQUESTER:
    case ReferralActivityVerb.REMOVED_OBSERVER:
      activity.item_content_object === null
        ? (itemName = intl.formatMessage(messages.deletedUser))
        : (itemName = getUserFullnameOrEmail(activity.item_content_object));
      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{
            actorName: actorName,
            requesterName: itemName,
          }}
        />
      );
      break;

    case ReferralActivityVerb.ASSIGNED_UNIT:
    case ReferralActivityVerb.UNASSIGNED_UNIT:
      activity.item_content_object === null
        ? (itemName = intl.formatMessage(messages.deletedUnit))
        : (itemName = activity.item_content_object.name);

      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{
            actorName: actorName,
            unit: itemName,
          }}
        />
      );
      break;

    case ReferralActivityVerb.URGENCYLEVEL_CHANGED:
      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{
            actorName: actorName,
          }}
        />
      );
      break;

    case ReferralActivityVerb.CLOSED:
      message = (
        <FormattedMessage
          {...messages[activity.verb]}
          values={{
            actorName: actorName,
          }}
        />
      );
      break;
  }

  let messageLine2: React.ReactNode = null;
  switch (activity.verb) {
    case ReferralActivityVerb.ANSWERED:
      messageLine2 = (
        <ActivityAnsweredValidations answer={activity.item_content_object} />
      );
      break;

    case ReferralActivityVerb.URGENCYLEVEL_CHANGED:
      messageLine2 = (
        <ActivityUrgencyLevelChanged
          referralurgencylevelhistory={activity.item_content_object}
        />
      );
      break;

    case ReferralActivityVerb.CLOSED:
      messageLine2 = <ActivityCloseReferral activity={activity} />;
      break;

    case ReferralActivityVerb.ASSIGNED_UNIT:
      messageLine2 = <ActivityAssignedUnit activity={activity} />;
      break;
  }

  return (
    <section className="flex flex-row">
      <svg
        role="presentation"
        aria-hidden="true"
        className="fill-current text-gray-400 w-12 h-12 -ml-6"
      >
        <use xlinkHref={`${appData.assets.icons}#icon-dot-single`} />
      </svg>
      <div className="flex flex-col justify-center">
        <div className="space-x-2">
          <span>{message}</span>
          <span>•</span>
          <span className="text-gray-600">
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
          </span>
        </div>
        {messageLine2 ? <div>{messageLine2}</div> : null}
      </div>
    </section>
  );
};
