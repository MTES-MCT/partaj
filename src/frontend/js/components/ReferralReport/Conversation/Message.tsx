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
  ReportVersionEventVerb,
  ReportAppendixEventVerb,
  User,
  UserLite,
} from '../../../types';
import { Nullable } from '../../../types/utils';
import { getUserFullname } from '../../../utils/user';
import { Spinner } from '../../Spinner';
import { Attachments, Files } from './Attachments';
import { MailSentIcon } from '../../Icons';
import { EventMessage } from './EventMessage';
import { isEvent } from '../../../utils/styles';

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
  [ReportVersionEventVerb.NEUTRAL]: {
    color: 'text-gray-600',
    border: 'border-l-2 border-gray-300 pl-1 pr-2',
  },
  [ReportVersionEventVerb.VERSION_ADDED]: {
    color: 'text-primary-600',
    border: 'border-l-2 border-primary-300 pl-1 pr-2',
  },
  [ReportAppendixEventVerb.APPENDIX_ADDED]: {
    color: 'text-primary-600',
    border: 'border-l-2 border-primary-300 pl-1 pr-2',
  },
  [ReportVersionEventVerb.VERSION_UPDATED]: {
    color: 'text-primary-600',
    border: 'border-l-2 border-primary-300 pl-1 pr-2',
  },
  [ReportAppendixEventVerb.APPENDIX_UPDATED]: {
    color: 'text-primary-600',
    border: 'border-l-2 border-primary-300 pl-1 pr-2',
  },
  [ReportVersionEventVerb.VERSION_VALIDATED]: {
    color: 'text-success-600',
    border: 'border-l-2 border-success-300 pl-1 pr-2',
  },
  [ReportAppendixEventVerb.APPENDIX_VALIDATED]: {
    color: 'text-success-600',
    border: 'border-l-2 border-success-300 pl-1 pr-2',
  },
  [ReportVersionEventVerb.MESSAGE]: {
    color: 'text-black',
    border: 'px-2 ',
  },
  [ReportVersionEventVerb.REQUEST_VALIDATION]: {
    color: 'text-gold-600',
    border: 'border-l-2 border-warning-300 pl-1 pr-2',
  },
  [ReportAppendixEventVerb.APPENDIX_REQUEST_VALIDATION]: {
    color: 'text-gold-600',
    border: 'border-l-2 border-warning-300 pl-1 pr-2',
  },
  [ReportAppendixEventVerb.APPENDIX_REQUEST_CHANGE]: {
    color: 'text-danger-600',
    border: 'border-l-2 border-danger-300 pl-1 pr-2',
  },
  [ReportVersionEventVerb.REQUEST_CHANGE]: {
    color: 'text-danger-600',
    border: 'border-l-2 border-danger-300 pl-1 pr-2',
  },
};

interface MessageProps {
  created_at?: string;
  user: UserLite | Nullable<User>;
  verb?: ReportVersionEventVerb | ReportAppendixEventVerb;
  message: string;
  attachments?: ReferralMessageAttachment[] | File[];
  isProcessing?: boolean;
  notifications?: MessageNotification[];
  version?: {
    version_number: Nullable<number>;
  };
  appendix?: {
    appendix_number: Nullable<number>;
  };
  metadata?: ReportEvent['metadata'];
}

export const Message = ({
  isProcessing,
  created_at,
  user,
  verb = ReportVersionEventVerb.MESSAGE,
  message,
  version,
  appendix,
  attachments,
  notifications,
  metadata,
}: MessageProps) => {
  const seed = useUIDSeed();
  const intl = useIntl();
  const username = user
    ? getUserFullname(user)
    : intl.formatMessage(messages.deletedUser);

  const getBorder = (verb: string) => {
    return eventStyle.hasOwnProperty(verb)
      ? eventStyle[verb as ReportEventVerb].border
      : eventStyle[ReportVersionEventVerb.NEUTRAL].border;
  };

  return (
    <li
      className="user-content flex flex-col w-full whitespace-pre-wrap mb-3 pl-2"
      data-testid="message-li"
    >
      <div className="flex flex-col">
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

        <div className={`flex w-fit relative`}>
          <div className="flex items-start leading-5">
            {(version || appendix) && isEvent(verb) ? (
              <EventMessage
                username={username}
                metadata={metadata}
                verb={verb}
                version={version ? version.version_number : null}
                appendix={appendix ? appendix.appendix_number : null}
              />
            ) : (
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
      </div>

      <div className="relative flex">
        {isEvent(verb) && (
          <div
            className={`absolute ${getBorder(verb)}`}
            style={{ left: '-13px', height: '100%' }}
          >
            {' '}
          </div>
        )}
        <div className="relative flex flex-col">
          <span className="break-words">{message}</span>
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
            <div className="flex items-center pt-1">
              <MailSentIcon />
              <div className="flex items-center">
                {notifications.map((notification: MessageNotification) => {
                  return (
                    <span
                      key={notification.id}
                      className={`rounded-sm font-light text-sm ml-1`}
                    >
                      @{notification.notified.display_name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};
