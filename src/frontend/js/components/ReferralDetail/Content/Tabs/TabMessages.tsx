import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReferralMessages } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import {
  ErrorCodes,
  ErrorFile,
  ErrorResponse,
  QueuedMessage,
  Referral,
} from 'types';
import { getUserFullname } from 'utils/user';
import { getUnitOwners } from 'utils/unit';
import { Message } from '../../../ReferralReport/Conversation/Message';
import { ProcessingMessage } from '../../../ReferralReport/Conversation/ProcessingMessage';
import { ErrorModal } from '../../../modals/ErrorModal';
import { commonMessages } from '../../../../const/translations';

const messages = defineMessages({
  loadingReferralMessages: {
    defaultMessage: 'Loading messages...',
    description:
      'Accessible message for the messages spinner in the referral detail view.',
    id: 'components.ReferralDetail.TabMessages.loadingReferralMessages',
  },
  messageAttachmentButton: {
    defaultMessage: 'Manage attachments',
    description:
      'Accessible label for the paperclip attachments button in the referral messages panel.',
    id: 'components.ReferralDetail.TabMessages.messageAttachmentButton',
  },
  messagesInputLabel: {
    defaultMessage: 'Send a message',
    description:
      'Accessible label for the chat input field in the referral detail view.',
    id: 'components.ReferralDetail.TabMessages.messagesInputLabel',
  },
  removeFile: {
    defaultMessage: 'Remove',
    description:
      'Accessible name for the X icon to remove a file from a message in the referral detail messages tab.',
    id: 'components.ReferralDetail.TabMessages.removeFile',
  },
  sendMessage: {
    defaultMessage: 'Send',
    description: 'Button text for the button to send a message on a referral.',
    id: 'components.ReferralDetail.TabMessages.sendMessage',
  },

  sendToRequester: {
    defaultMessage: `Send a message to requesters for this referral: { requesters }.
They will receive an email to inform them of your message.`,
    description: 'Help text on empty chat tab for unit members.',
    id: 'components.ReferralDetail.TabMessages.sendToRequester',
  },
  sendToUnitOwners: {
    defaultMessage: `Send a message to the head(s) of the {unitCount, plural,
      one {unit}
      other {units}
} linked to this referral: { unitOwners }. They will receive an email to inform them of your message.`,
    description:
      'Help text on empty chat tab for requesters when there are no assignees.',
    id: 'components.ReferralDetail.TabMessages.sendToUnitOwners',
  },
  sendToUnitOwnersWithAssignee: {
    defaultMessage: `Send a message to { assignee }, who is the assignee for this referral. They will receive an email to inform them of your message. The head(s) :{  unitOwners } will be notified for your message.`,
    description: 'Help text to inform  requesters unit owner will be notified.',
    id: 'components.ReferralDetail.TabMessages.sendToUnitOwnersWithAssignee',
  },
  sendToUnitOwnersWithAssignees: {
    defaultMessage: `Send a message to assignees for this referral: { assignees }. They will receive an email to inform them of your message. The head(s): {  unitOwners } will be notified for your message.`,
    description: 'Help text to inform  requesters unit owner will be notified.',
    id: 'components.ReferralDetail.TabMessages.sendToUnitOwnersWithAssignees',
  },

  helpText: {
    defaultMessage: `Press Shift + Enter to send a message`,
    description: 'Help text on send message.',
    id: 'components.ReferralDetail.TabMessages.helpText',
  },
});

interface ScrollMeIntoViewProps {
  scrollKey: string;
}

// We're using this to automatically scroll to the bottom of the messages list
// upon first rendering it or whenever the key changes.
const ScrollMeIntoView = ({ scrollKey }: ScrollMeIntoViewProps) => {
  const scrollMeIntoViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollMeIntoViewRef.current) {
      scrollMeIntoViewRef.current.scrollIntoView?.(false);
    }
  }, [scrollKey]);

  return <div ref={scrollMeIntoViewRef} />;
};

interface TabMessagesProps {
  referral: Referral;
}

export const TabMessages = ({ referral }: TabMessagesProps) => {
  const seed = useUIDSeed();
  const intl = useIntl();

  const { currentUser } = useCurrentUser();
  const [files, setFiles] = useState<File[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]): void => {
      setFiles((prevFiles) => {
        return [...prevFiles, ...acceptedFiles];
      });
    },
    [files],
  );

  const onDropRejected = useCallback(
    (rejectedFiles: Array<ErrorFile>): void => {
      for (const rejectedFile of rejectedFiles) {
        for (const error of rejectedFile['errors']) {
          if (error.code === 'file-invalid-type') {
            setErrorModalOpen(true);
            return;
          }
        }
      }
    },
    [],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDropRejected,
    onDrop,
  });
  const [isErrorModalOpen, setErrorModalOpen] = useState(false);
  const { data, status } = useReferralMessages({
    referral: String(referral.id),
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
              files,
              referral: String(referral.id),
            },
            realId: null,
            tempId,
          },
        ]);
        setMessageContent('');
        setFiles([]);
      };

      return (
        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="min-h-210 relative flex-grow">
            {/* NB: this trick allows us to force limit the size of the messages container, scrolling
                inside it if necessary to display all the messages. */}
            <div className="absolute inset-0 flex">
              <div className="w-full flex flex-col mx-4 my-2 space-y-2 overflow-auto">
                {data!.results.map((message) => (
                  <Message
                    key={message.id}
                    user={message.user}
                    message={message.content}
                    attachments={message.attachments}
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
                      queryKey="referralmessages"
                      url="/api/referralmessages/"
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
                      onError={(error: ErrorResponse) => {
                        if (error.code === ErrorCodes.FILE_FORMAT_FORBIDDEN) {
                          setMessageQueue((prevState) => {
                            prevState.pop();
                            return [...prevState];
                          });
                          setMessageContent(queuedMessage.payload.content);
                          setFiles([]);
                          setErrorModalOpen(true);
                        }
                      }}
                    />
                  ))}
                <ScrollMeIntoView
                  scrollKey={
                    messageQueue.length > 0
                      ? messageQueue[messageQueue.length - 1].tempId
                      : data!.results[data!.results.length - 1]?.id
                  }
                />
              </div>
            </div>
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
            {referral.users
              .map((user) => user.id)
              .includes(currentUser?.id || '$' /* impossible id */) ? (
              <div className="px-8 py-4 bg-gray-200">
                {referral.assignees.length === 0 ? (
                  <FormattedMessage
                    {...messages.sendToUnitOwners}
                    values={{
                      unitCount: referral.units.length,
                      unitOwners: (
                        <b>
                          {referral.units
                            .map((unit) => getUnitOwners(unit))
                            .reduce(
                              (list, unitOwners) => [...list, ...unitOwners],
                              [],
                            )
                            .map((unitOwner) => getUserFullname(unitOwner))
                            .join(', ')}
                        </b>
                      ),
                    }}
                  />
                ) : referral.assignees.length === 1 ? (
                  <>
                    <FormattedMessage
                      {...messages.sendToUnitOwnersWithAssignee}
                      values={{
                        assignee: (
                          <b>{getUserFullname(referral.assignees[0])}</b>
                        ),
                        unitOwners: (
                          <b>
                            {referral.units
                              .map((unit) => getUnitOwners(unit))
                              .reduce(
                                (list, unitOwners) => [...list, ...unitOwners],
                                [],
                              )
                              .map((unitOwner) => getUserFullname(unitOwner))
                              .join(', ')}
                          </b>
                        ),
                      }}
                    />
                  </>
                ) : (
                  <FormattedMessage
                    {...messages.sendToUnitOwnersWithAssignees}
                    values={{
                      assignees: (
                        <b>
                          {referral.assignees
                            .map((assignee) => getUserFullname(assignee))
                            .join(', ')}
                        </b>
                      ),
                      unitOwners: (
                        <b>
                          {referral.units
                            .map((unit) => getUnitOwners(unit))
                            .reduce(
                              (list, unitOwners) => [...list, ...unitOwners],
                              [],
                            )
                            .map((unitOwner) => getUserFullname(unitOwner))
                            .join(', ')}
                        </b>
                      ),
                    }}
                  />
                )}
              </div>
            ) : data!.count === 0 && messageQueue.length === 0 ? (
              <div className="px-8 py-4 bg-gray-200">
                <FormattedMessage
                  {...messages.sendToRequester}
                  values={{
                    requesters: (
                      <b>
                        {referral.users
                          .map((user) => getUserFullname(user))
                          .join(', ')}
                      </b>
                    ),
                  }}
                />
              </div>
            ) : null}

            <div className="form-control flex flex-col">
              <div className="flex flew-row items-center">
                <button
                  type="button"
                  {...getRootProps()}
                  className="p-2 text-gray-500 hover:text-primary-500"
                  aria-labelledby={seed('message-attachment-button')}
                >
                  <input {...getInputProps()} />
                  <svg role="img" className="fill-current block w-5 h-5">
                    <title id={seed('message-attachment-button')}>
                      <FormattedMessage {...messages.messageAttachmentButton} />
                    </title>
                    <use xlinkHref={`${appData.assets.icons}#icon-paperclip`} />
                  </svg>
                </button>
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
                      <textarea
                        title={intl.formatMessage(messages.messagesInputLabel)}
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

              {files.length > 0 ? (
                <ul>
                  {files.map((file) => (
                    <li
                      key={file.name}
                      className="inline-block mt-1 mr-1 px-2 py-1 border border-gray-500 rounded bg-gray-200"
                    >
                      <div className="flex flex-row space-x-2">
                        <span>{file.name}</span>
                        <button
                          type="button"
                          aria-labelledby={seed(file)}
                          onClick={() =>
                            setFiles((existingFiles) =>
                              existingFiles.filter(
                                (existingFile) => existingFile !== file,
                              ),
                            )
                          }
                        >
                          <svg role="img" className="w-4 h-4 fill-current">
                            <use
                              xlinkHref={`${appData.assets.icons}#icon-cross`}
                            />
                            <title id={seed(file)}>
                              <FormattedMessage {...messages.removeFile} />
                            </title>
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex justify-center pt-4 text-gray-500">
              <FormattedMessage {...messages.helpText} />
            </div>
          </form>
          <ErrorModal
            isModalOpen={isErrorModalOpen}
            onConfirm={() => setErrorModalOpen(false)}
            textContent={intl.formatMessage(
              commonMessages.multipleErrorFileFormatText,
            )}
          />
        </div>
      );
  }
};
