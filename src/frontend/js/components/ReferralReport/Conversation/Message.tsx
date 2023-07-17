import React from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
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
});

const eventStyle = {
  [ReportEventVerb.NEUTRAL]: {
    background: 'bg-gray-100',
    border: 'border-l-4 border-gray-500 pl-1 pr-2',
    icon: IconColor.GRAY_500,
  },
  [ReportEventVerb.VERSION_ADDED]: {
    background: 'bg-primary-100',
    border: 'border-l-4 border-primary-400 pl-1 pr-2',
    icon: IconColor.PRIMARY_1000,
  },
  [ReportEventVerb.VERSION_UPDATED]: {
    background: 'bg-primary-100',
    border: 'border-l-4 border-primary-400 pl-1 pr-2',
    icon: IconColor.PRIMARY_1000,
  },
  [ReportEventVerb.VERSION_VALIDATED]: {
    background: 'bg-success-200',
    border: 'border-l-4 border-success-600 pl-1 pr-2',
    icon: IconColor.SUCCESS_700,
  },
  [ReportEventVerb.MESSAGE]: {
    background: 'bg-white',
    border: 'px-2 ',
    icon: IconColor.BLACK,
  },
  [ReportEventVerb.REQUEST_VALIDATION]: {
    background: 'bg-warning-200',
    border: 'border-l-4 border-warning-500 pl-1 pr-2',
    icon: IconColor.WARNING_500,
  },
  [ReportEventVerb.REQUEST_CHANGE]: {
    background: 'bg-danger-200',
    border: 'border-l-4 border-danger-400 pl-1 pr-2',
    icon: IconColor.DANGER_400,
  },
};

type EventMessageKeys = Exclude<
  ReportEventVerb,
  ReportEventVerb.MESSAGE | ReportEventVerb.NEUTRAL
>;

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
  const getBorder = (verb: string) => {
    return eventStyle.hasOwnProperty(verb)
      ? eventStyle[verb as ReportEventVerb].border
      : eventStyle[ReportEventVerb.NEUTRAL].border;
  };

  const getBackground = (verb: string) => {
    return eventStyle.hasOwnProperty(verb)
      ? eventStyle[verb as ReportEventVerb].background
      : eventStyle[ReportEventVerb.NEUTRAL].background;
  };

  return (
    <article className="user-content flex flex-col w-full whitespace-pre-wrap mb-3">
      <div className="flex flex-col">
        {created_at ? (
          <span className="text-sm text-gray-400 pl-2">
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
          <span className="text-sm text-gray-400 pl-2">
            <FormattedMessage {...messages.now} />
          </span>
        )}
        <div
          className={`flex rounded-r-sm w-fit px-1 ${
            getBackground(verb) + ' ' + getBorder(verb)
          }`}
        >
          {version && (
            <EventMessage
              user={user}
              metadata={metadata}
              verb={verb}
              version={version?.version_number}
            />
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
                  className={`${getBackground(
                    verb,
                  )} rounded-sm font-light text-sm ml-1`}
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
