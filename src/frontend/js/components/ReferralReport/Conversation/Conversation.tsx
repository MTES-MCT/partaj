import React, { useContext, useRef, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReportMessages } from 'data';
import { QueuedMessage, UserLite } from '../../../types';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { ProcessingMessage } from './ProcessingMessage';
import { Message } from './Message';
import { UnitMembershipSearch } from '../../Search/UnitMembershipSearch';
import { NotificationList } from './NotificationList';
import { SubmitButton } from '../../buttons/SubmitButton';
import { TextArea } from './TextArea';
import { ArrowUpIcon } from '../../Icons';

const messages = defineMessages({
  loadingReferralMessages: {
    defaultMessage: 'Loading messages...',
    description:
      'Accessible message for the messages spinner in the referral detail view.',
    id: 'components.Conversation.loadingReferralMessages',
  },
  helpText: {
    defaultMessage: `Press Shift + Enter to send a message`,
    description: 'Help text on send message.',
    id: 'components.Conversation.helpText',
  },
  title: {
    defaultMessage: `Thread`,
    description: 'Conversation title',
    id: 'components.Conversation.title',
  },
});

export const Conversation = () => {
  const seed = useUIDSeed();
  const { referral } = useContext(ReferralContext);
  const [messageContent, setMessageContent] = useState('');
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
  const [notifications, setNotifications] = useState<UserLite[]>([]);
  const [isSearching, setSearching] = useState<boolean>(false);
  const [isTextAreaFocused, setTextAreaFocused] = useState<boolean>(false);

  const removeItem = (item: UserLite) => {
    setNotifications((prevNotifications) => {
      return prevNotifications.filter((notification) => {
        return item.id !== notification.id;
      });
    });
  };

  const addItem = (item: UserLite) => {
    setNotifications((prevNotifications) => {
      return [...prevNotifications, item];
    });
  };

  const focusTextArea = () => {
    setTextAreaFocused(true);
  };

  const { data, status } = useReportMessages({
    report: String(referral!.report!.id),
  });

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingReferralMessages} />
        </Spinner>
      );

    case 'success':
      const submitForm = () => {
        const tempId = seed({
          content: messageContent,
          timestamp: new Date().getTime(),
        });
        setMessageQueue((existingQueue) => [
          {
            payload: {
              content: messageContent,
              report: String(referral!.report!.id),
              notifications: notifications.map((user) => user.id),
            },
            realId: null,
            tempId,
          },
          ...existingQueue,
        ]);
        setNotifications([]);
        setMessageContent('');
      };

      return (
        <div className="flex-grow flex flex-col ">
          `
          <p className="font-semibold">
            <FormattedMessage {...messages.title} />
          </p>
          <div className="w-full flex flex-col-reverse mx-4 my-2 overflow-auto max-h-160 min-h-20">
            {messageQueue
              // Remove sent messages from the queue only when their counterparts from the API are
              // actually about to be rendered
              .filter(
                (queuedMessage) =>
                  !data!.results
                    .map((message) => message.id)
                    .includes(queuedMessage.realId!),
              )
              .map((queuedMessage) => (
                <ProcessingMessage
                  key={queuedMessage.tempId}
                  queryKey="reportmessages"
                  url="/api/reportmessages/"
                  queuedMessage={queuedMessage}
                  onSuccess={(successfulMessage) =>
                    setMessageQueue((existingQueue) =>
                      existingQueue.map((messagefromQueue) =>
                        messagefromQueue.tempId === queuedMessage.tempId
                          ? successfulMessage
                          : messagefromQueue,
                      ),
                    )
                  }
                />
              ))}
            {data!.results.map((message) => (
              <Message
                key={message.id}
                message={message.content}
                user={message.user}
                created_at={message.created_at}
                notifications={message.notifications}
              />
            ))}
          </div>
          <NotificationList
            removeItem={removeItem}
            notifications={notifications}
          />
          <form
            style={{ padding: '0 3px 3px' }}
            onSubmit={(e) => {
              e.preventDefault();
              if (messageContent.length > 0) {
                submitForm();
              }
            }}
          >
            <div className="form-control flex flex-col">
              <div className="flex relative">
                <TextArea
                  focus={isTextAreaFocused}
                  messageContent={messageContent}
                  submitForm={() => submitForm()}
                  onChange={(value: string) => setMessageContent(value)}
                  isSearching={isSearching}
                />
                <div className="absolute flex items-center right-0">
                  <UnitMembershipSearch
                    onSearchAction={(isSearching: boolean) => {
                      setSearching(isSearching);
                      isSearching && setTextAreaFocused(false);
                    }}
                    addItem={(item: UserLite) => addItem(item)}
                    onDisappear={() => {
                      focusTextArea();
                    }}
                  />
                  <SubmitButton>
                    <ArrowUpIcon />
                  </SubmitButton>
                </div>
              </div>
            </div>
            <div className="flex justify-center pt-4 text-gray-500">
              <FormattedMessage {...messages.helpText} />
            </div>
          </form>
        </div>
      );
  }
};
