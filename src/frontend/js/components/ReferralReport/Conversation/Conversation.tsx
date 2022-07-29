import React, { useContext, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReportMessages } from 'data';
import { QueuedMessage } from '../../../types';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { ProcessingMessage } from './ProcessingMessage';
import { Message } from './Message';

const messages = defineMessages({
  loadingReferralMessages: {
    defaultMessage: 'Loading messages...',
    description:
      'Accessible message for the messages spinner in the referral detail view.',
    id: 'components.Conversation.loadingReferralMessages',
  },
  messagesInputLabel: {
    defaultMessage: 'Send a message',
    description:
      'Accessible label for the chat input field in the referral detail view.',
    id: 'components.Conversation.messagesInputLabel',
  },
  sendMessage: {
    defaultMessage: 'Send',
    description: 'Button text for the button to send a message on a referral.',
    id: 'components.Conversation.sendMessage',
  },
  helpText: {
    defaultMessage: `Press Shift + Enter to send a message`,
    description: 'Help text on send message.',
    id: 'components.Conversation.helpText',
  },
});

export const Conversation = () => {
  const seed = useUIDSeed();
  const { referral } = useContext(ReferralContext);
  const [messageContent, setMessageContent] = useState('');
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);

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
          ...existingQueue,
          {
            payload: {
              content: messageContent,
              report: String(referral!.report!.id),
            },
            realId: null,
            tempId,
          },
        ]);
        setMessageContent('');
      };

      return (
        <div className="flex-grow flex flex-col ">
          <div className="w-full flex flex-col-reverse mx-4 my-2 overflow-auto h-160">
            {data!.results.map((message) => (
              <Message
                key={message.id}
                message={message.content}
                user={message.user}
                created_at={message.created_at}
              />
            ))}
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
          </div>
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
              <div className="flex flew-row items-center">
                <div className="flex-grow px-4 pt-2">
                  <div className="relative">
                    {/* This div is used as a carbon copy of the textarea. It's a trick to auto-expand
            the actual textarea to fit its content. */}
                    <div
                      aria-hidden={true}
                      className="user-content opacity-0 overflow-hidden"
                      style={{ maxHeight: '15rem', minHeight: '3rem' }}
                    >
                      {messageContent}
                      {/* Zero-width space to force line-breaks to actually occur even when there
              is no characted on the new line */}
                      &#65279;
                    </div>
                    <div className="absolute inset-0">
                      <label
                        htmlFor={seed('tab-messages-text-input')}
                        className="sr-only"
                      >
                        <FormattedMessage {...messages.messagesInputLabel} />
                      </label>
                      <textarea
                        id={seed('tab-messages-text-input')}
                        className="w-full h-full resize-none outline-none"
                        value={messageContent}
                        onChange={(event) =>
                          setMessageContent(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.shiftKey &&
                            (event.key === 'Enter' || event.keyCode === 13)
                          ) {
                            event.preventDefault();
                            if (messageContent.length > 0) {
                              submitForm();
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary border border-primary-500"
                >
                  <FormattedMessage {...messages.sendMessage} />
                </button>
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
