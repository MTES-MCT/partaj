import React from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
} from 'react-intl';
import {
  Attachment,
  MessageNotification,
  ReferralMessageAttachment,
  User,
  UserLite,
} from '../../../types';
import { useCurrentUser } from '../../../data/useCurrentUser';
import { Nullable } from '../../../types/utils';
import { getUserFullname } from '../../../utils/user';
import { Spinner } from '../../Spinner';
import { useUIDSeed } from 'react-uid';
import { Attachments, Files } from './Attachments';
import { MailSentIcon } from '../../Icons';

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
});

interface MessageProps {
  created_at?: string;
  user: UserLite | Nullable<User>;
  message: string;
  attachments?: ReferralMessageAttachment[] | File[];
  isProcessing?: boolean;
  notifications?: MessageNotification[];
}

export const Message = ({
  isProcessing,
  created_at,
  user,
  message,
  attachments,
  notifications,
}: MessageProps) => {
  const { currentUser } = useCurrentUser();
  const seed = useUIDSeed();

  return (
    <article
      style={{ width: '48rem' }}
      className={`user-content max-w-2xl flex flex-col mt-2 pt-3 pb-3 pl-5 pr-5 rounded ${
        user && user.id === currentUser?.id
          ? 'self-end bg-warning-100'
          : 'bg-gray-200'
      }`}
    >
      <div className="leading-7 flex flex-row space-x-2">
        <span className="font-medium">
          {user ? (
            getUserFullname(user)
          ) : (
            <FormattedMessage {...messages.someUser} />
          )}
        </span>

        {created_at ? (
          <span className="text-sm text-gray-500">
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
          <span className="text-sm text-gray-500">
            <FormattedMessage {...messages.now} />
          </span>
        )}
        {isProcessing ? (
          <div>
            <Spinner>
              <FormattedMessage {...messages.sendingMessage} />
            </Spinner>
          </div>
        ) : null}
      </div>
      <p>{message}</p>

      {attachments && attachments.length > 0 ? (
        <div className="mt-3" style={{ width: '28rem' }}>
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
        <div className="flex items-center">
          <MailSentIcon />
          <div className="flex items-center">
            {notifications.map((notification: MessageNotification) => {
              return (
                <span className="font-light text-sm ml-1">
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
