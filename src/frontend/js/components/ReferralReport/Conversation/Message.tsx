import React from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
  useIntl,
} from 'react-intl';
import { useUIDSeed } from 'react-uid';

import {
  Attachment,
  MessageNotification,
  ReferralMessageAttachment,
  ReportEvent,
  ReportEventVerb,
  User,
  UserLite,
} from '../../../types';
import { Nullable } from '../../../types/utils';
import { getUserFullname } from '../../../utils/user';
import { Spinner } from '../../Spinner';
import { Attachments, Files } from './Attachments';
import { IconColor, MailSentIcon } from '../../Icons';
import { EventMessage } from './EventMessage';

const messages = defineMessages({
  someUser: {
    defaultMessage: 'Some user',
    description: `Default message to avoid erroring out when we are rendering
a newly created message and we are missing the current user.`,
    id: 'components.Message.someUser',
  },
  now: {
    defaultMessage: 'Just now',
    description:
      'Temporary indicator for the timing of a referral message which is being created.',
    id: 'components.Message.now',
  },
  sendingMessage: {
    defaultMessage: 'Sending message...',
    description:
      'Accessible message for the spinner while a message is being sent.',
    id: 'components.Message.sendingMessage',
  },
  attachmentsTitle: {
    defaultMessage: 'Attachments',
    description: 'Title for the list of attachments in a referral message.',
    id: 'components.Message.attachmentsTitle',
  },
  deletedUser: {
    defaultMessage: '"deleted user"',
    description: 'name of deleted user.',
    id: 'components.Message.deletedUser',
  },
});

const eventStyle = {
  [ReportEventVerb.NEUTRAL]: {
    color: 'text-gray-600',
    border: 'border-l-2 border-gray-200 pl-1 pr-2',
    icon: IconColor.GRAY_500,
  },
  [ReportEventVerb.VERSION_ADDED]: {
    color: 'text-primary-600',
    border: 'border-l-2 border-primary-200 pl-1 pr-2',
    icon: IconColor.PRIMARY_1000,
  },
  [ReportEventVerb.VERSION_UPDATED]: {
    color: 'text-primary-600',
    border: 'border-l-2 border-primary-200 pl-1 pr-2',
    icon: IconColor.PRIMARY_1000,
  },
  [ReportEventVerb.VERSION_VALIDATED]: {
    color: 'text-success-600',
    border: 'border-l-2 border-success-200 pl-1 pr-2',
    icon: IconColor.SUCCESS_700,
  },
  [ReportEventVerb.MESSAGE]: {
    color: 'text-black',
    border: 'px-2 ',
    icon: IconColor.BLACK,
  },
  [ReportEventVerb.REQUEST_VALIDATION]: {
    color: 'text-gold-600',
    border: 'border-l-2 border-warning-200 pl-1 pr-2',
    icon: IconColor.WARNING_500,
  },
  [ReportEventVerb.REQUEST_CHANGE]: {
    color: 'text-danger-600',
    border: 'border-l-2 border-danger-200 pl-1 pr-2',
    icon: IconColor.DANGER_400,
  },
};

interface MessageProps {
  created_at?: string;
  user: UserLite | Nullable<User>;
  verb?: ReportEventVerb;
  message: string;
  attachments?: ReferralMessageAttachment[] | File[];
  isProcessing?: boolean;
  notifications?: MessageNotification[];
  version?: {
    version_number: Nullable<number>;
  };
  metadata?: ReportEvent['metadata'];
}

export const Message = ({
  isProcessing,
  created_at,
  user,
  verb = ReportEventVerb.MESSAGE,
  message,
  version,
  attachments,
  notifications,
  metadata,
}: MessageProps) => {
  const seed = useUIDSeed();
  const intl = useIntl();
  const username = user
    ? getUserFullname(user)
    : intl.formatMessage(messages.deletedUser);
  const getColor = (verb: string) => {
    return eventStyle.hasOwnProperty(verb)
      ? eventStyle[verb as ReportEventVerb].color
      : eventStyle[ReportEventVerb.NEUTRAL].color;
  };

  const getBorder = (verb: string) => {
    return eventStyle.hasOwnProperty(verb)
      ? eventStyle[verb as ReportEventVerb].border
      : eventStyle[ReportEventVerb.NEUTRAL].border;
  };

  return (
    <article className="user-content flex flex-col w-full whitespace-pre-wrap mb-3">
      <div className="flex flex-col">
        {created_at ? (
          <span className="text-sm text-gray-500 pl-2">
            <FormattedDate
              year="numeric"
              month="long"
              day="numeric"
              value={created_at}
            />
            {', '}
            <FormattedTime value={created_at} />
          </span>
        ) : (
          <span className="text-sm text-gray-500 pl-2">
            <FormattedMessage {...messages.now} />
          </span>
        )}
        <div className={`flex rounded-r-sm w-fit px-1 ${getBorder(verb)}`}>
          {version &&
            [
              ReportEventVerb.REQUEST_VALIDATION,
              ReportEventVerb.VERSION_UPDATED,
              ReportEventVerb.VERSION_ADDED,
              ReportEventVerb.REQUEST_CHANGE,
              ReportEventVerb.VERSION_VALIDATED,
            ].includes(verb) && (
              <EventMessage
                username={username}
                metadata={metadata}
                color={getColor(verb)}
                verb={verb}
                version={version?.version_number}
              />
            )}
          {[ReportEventVerb.MESSAGE].includes(verb) && (
            <span className="font-medium">{username}</span>
          )}
          {isProcessing ? (
            <div>
              <Spinner>
                <FormattedMessage {...messages.sendingMessage} />
              </Spinner>
            </div>
          ) : null}
        </div>
      </div>
      <p className={`${getBorder(verb)}`}>{message}</p>
      {attachments && attachments.length > 0 ? (
        <div className={`mt-3 ${getBorder(verb)}`} style={{ width: '28rem' }}>
          <h5
            className="text-sm font-medium mb-1"
            id={seed('message-attachments-list')}
          >
            <FormattedMessage {...messages.attachmentsTitle} />
          </h5>
          {isProcessing ? (
            <Files
              files={attachments as File[]}
              labelId={seed('message-attachments-list')}
            />
          ) : (
            <Attachments
              attachments={attachments as Attachment[]}
              labelId={seed('message-attachments-list')}
            />
          )}
        </div>
      ) : null}
      {notifications && notifications.length > 0 && (
        <div className={`flex items-center pt-1 ${getBorder(verb)}`}>
          <MailSentIcon />
          <div className="flex items-center">
            {notifications.map((notification: MessageNotification) => {
              return (
                <span
                  key={notification.notified.display_name}
                  className={`rounded-sm font-light text-sm ml-1`}
                >
                  @{notification.notified.display_name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
};
