import React, { useContext, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReportEvents } from 'data';
import { QueuedMessage, UserLite } from '../../../types';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { ProcessingMessage } from './ProcessingMessage';
import { Message } from './Message';
import { UnitMembershipSearch } from '../../Search/UnitMembershipSearch';
import { NotificationList } from './NotificationList';
import { SubmitButton } from '../../buttons/SubmitButton';
import { ArrowUpIcon, DiscussIcon } from '../../Icons';
import { getUnitsNames } from 'utils/unit';
import { TextArea } from '../../inputs/TextArea';
import { LockIcon } from 'lucide-react';

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
    defaultMessage: `Private messaging accessible only to members of the offices assigned to this referral`,
    description: 'Conversation title',
    id: 'components.Conversation.title',
  },
  noMessage: {
    defaultMessage: `There is no message yet`,
    description: 'Text used when no conversation message exists',
    id: 'components.Conversation.noMessage',
  },
  unitVisibility: {
    defaultMessage: `This conversation is only visible for`,
    description:
      'Text used on top of conversation to explain who can see messages',
    id: 'components.Conversation.unitVisibility',
  },
});

export const Conversation = () => {
  const seed = useUIDSeed();
  const { referral, refetch } = useContext(ReferralContext);
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

  const { data, status } = useReportEvents({
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
        <>
          <div
            data-testid="referral-report-conversation"
            className="flex flex-col"
          >
            <div className="inline-block border-2 border-black">
              <div className="flex p-2 items-center justify-center">
                <div className="mr-2">
                  <LockIcon className="w-4 h-4" />
                </div>
                <h2 className="text-sm text-grey-700">
                  <FormattedMessage {...messages.title} />
                </h2>
              </div>
              <ul
                className={`w-full flex relative flex-col-reverse px-2 py-1 overflow-auto max-h-160 min-h-80 ${
                  data!.results.length === 0 && messageQueue.length === 0
                    ? 'items-center'
                    : ''
                }`}
              >
                {data!.results.length === 0 && messageQueue.length === 0 && (
                  <span className="text-grey-600 justify-items-center absolute top-[180px]">
                    <FormattedMessage {...messages.noMessage} />
                  </span>
                )}
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
                      queryKey="reportevents"
                      url="/api/reportevents/"
                      queuedMessage={queuedMessage}
                      onSuccess={(successfulMessage) => {
                        setMessageQueue((existingQueue) =>
                          existingQueue.map((messagefromQueue) =>
                            messagefromQueue.tempId === queuedMessage.tempId
                              ? successfulMessage
                              : messagefromQueue,
                          ),
                        );
                        if (successfulMessage.is_granted_user_notified) {
                          refetch();
                        }
                      }}
                    />
                  ))}
                {data!.results.map((event) => (
                  <Message
                    key={event.id}
                    message={event.content}
                    version={event.version}
                    appendix={event.appendix}
                    verb={event.verb}
                    user={event.user}
                    created_at={event.created_at}
                    notifications={event.notifications}
                    metadata={event.metadata}
                  />
                ))}
              </ul>
              <NotificationList
                removeItem={removeItem}
                notifications={notifications}
              />
              <form
                style={{ padding: '0' }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (messageContent.length > 0) {
                    submitForm();
                  }
                }}
              >
                <div className="form-control-2 flex flex-col">
                  <div className="flex relative">
                    <UnitMembershipSearch
                      addItem={(item: UserLite) => {
                        if (
                          notifications.findIndex(
                            (obj) => obj.id === item.id,
                          ) == -1
                        )
                          addItem(item);
                      }}
                      onOpen={() => {
                        setTextAreaFocused(false);
                      }}
                      onClose={() => {
                        setSearching(false);
                        setTextAreaFocused(true);
                        focusTextArea();
                      }}
                    />
                    <TextArea
                      focus={isTextAreaFocused}
                      messageContent={messageContent}
                      submitForm={() => submitForm()}
                      onChange={(value: string) => setMessageContent(value)}
                      opacitize={isSearching}
                      customCss={{
                        carbonCopy: {
                          maxHeight: '15rem',
                          minHeight: '3rem',
                        },
                      }}
                    />
                    <SubmitButton>
                      <ArrowUpIcon className="w-4 h-4" />
                      <span>Envoyer</span>
                    </SubmitButton>
                  </div>
                </div>
              </form>
            </div>
            <div className="flex justify-center pt-4 text-gray-500">
              <FormattedMessage {...messages.helpText} />
            </div>
          </div>
        </>
      );
  }
};
