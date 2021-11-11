import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
} from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { AttachmentsList, FilesList } from 'components/AttachmentsList';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useCreateReferralMessage, useReferralMessages } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import { Referral } from 'types';
import { Nullable } from 'types/utils';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { getUserFullname } from 'utils/user';
import { getUnitOrganizers, getUnitOwners } from 'utils/unit';

const messages = defineMessages({
  attachmentsTitle: {
    defaultMessage: 'Attachments',
    description: 'Title for the list of attachments in a referral message.',
    id: 'components.ReferralDetail.TabMessages.attachmentsTitle',
  },
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
  now: {
    defaultMessage: 'Just now',
    description:
      'Temporary indicator for the timing of a referral message which is being created.',
    id: 'components.ReferralDetail.TabMessages.now',
  },
  removeFile: {
    defaultMessage: 'Remove',
    description:
      'Accessible name for the X icon to remove a file from a message in the referral detail messages tab.',
    id: 'components.ReferralDetail.TabMessages.removeFile',
  },
  sendingMessage: {
    defaultMessage: 'Sending message...',
    description:
      'Accessible message for the spinner while a message is being sent.',
    id: 'components.ReferralDetail.TabMessages.sendingMessage',
  },
  sendMessage: {
    defaultMessage: 'Send',
    description: 'Button text for the button to send a message on a referral.',
    id: 'components.ReferralDetail.TabMessages.sendMessage',
  },
  sendToAssignee: {
    defaultMessage: `Send a message to { assignee }, who is the assignee for this referral.
They will receive an email to inform them of your message.`,
    description:
      'Help text on empty chat tab for requesters when there is one assignee.',
    id: 'components.ReferralDetail.TabMessages.sendToAssignee',
  },
  sendToAssignees: {
    defaultMessage: `Send a message to assignees for this referral: { assignees }.
They will receive an email to inform them of your message.`,
    description:
      'Help text on empty chat tab for requesters when there are two or more assignees.',
    id: 'components.ReferralDetail.TabMessages.sendToAssignees',
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
  someUser: {
    defaultMessage: 'Some user',
    description: `Default message to avoid erroring out when we are rendering
a newly created message and we are missing the current user.`,
    id: 'components.ReferralDetail.TabMessages.someUser',
  },
});

interface QueuedMessage {
  payload: {
    content: string;
    files: File[];
    referral: string;
  };
  realId: Nullable<string>;
  tempId: string;
}

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

interface ProcessingMessageProps {
  onSuccess: (queuedMessage: QueuedMessage) => void;
  queuedMessage: QueuedMessage;
}

const ProcessingMessage = ({
  onSuccess,
  queuedMessage,
}: ProcessingMessageProps) => {
  const seed = useUIDSeed();
  const { currentUser } = useCurrentUser();
  const mutation = useCreateReferralMessage();

  useAsyncEffect(async () => {
    mutation.mutate(queuedMessage.payload, {
      onSuccess: (message) =>
        onSuccess({ ...queuedMessage, realId: message.id }),
    });
  }, []);

  return (
    <article
      className="user-content max-w-2xl flex flex-col space-y-6 p-6 bg-warning-100 rounded border self-end"
      style={{ width: '48rem' }}
    >
      <div className="flex flex-row space-x-4">
        <span className="font-bold">
          {currentUser ? (
            getUserFullname(currentUser)
          ) : (
            <FormattedMessage {...messages.someUser} />
          )}
        </span>
        <span className="text-gray-700">
          <FormattedMessage {...messages.now} />
        </span>
        <div className="flex-grow" />
        <div>
          <Spinner>
            <FormattedMessage {...messages.sendingMessage} />
          </Spinner>
        </div>
      </div>
      <p>{queuedMessage.payload.content}</p>
      {queuedMessage.payload.files.length > 0 ? (
        <div className="space-y-2" style={{ width: '28rem' }}>
          <h5 id={seed('message-attachments-list')}>
            <FormattedMessage {...messages.attachmentsTitle} />
          </h5>
          <FilesList
            files={queuedMessage.payload.files}
            labelId={seed('message-attachments-list')}
          />
        </div>
      ) : null}
    </article>
  );
};

interface TabMessagesProps {
  referral: Referral;
}

export const TabMessages = ({ referral }: TabMessagesProps) => {
  const seed = useUIDSeed();

  const { currentUser } = useCurrentUser();

  const [files, setFiles] = useState<File[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]): void => {
      setFiles([...files, ...acceptedFiles]);
    },
    [files],
  );
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

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
        <div className="flex-grow flex flex-col overflow-auto">
          <div className="relative flex-grow">
            {/* NB: this trick allows us to force limit the size of the messages container, scrolling
                inside it if necessary to display all the messages. */}
            <div className="absolute inset-0 flex">
              <div className="w-full flex flex-col mx-4 my-2 space-y-2 overflow-auto">
                {data!.results.map((message) => (
                  <article
                    key={message.id}
                    style={{ width: '48rem' }}
                    className={`user-content max-w-2xl flex flex-col space-y-6 p-6 rounded border ${
                      message.user.id === currentUser?.id
                        ? 'self-end bg-warning-100'
                        : 'bg-gray-200'
                    }`}
                  >
                    <div className="flex flex-row space-x-4">
                      <span className="font-bold">
                        {getUserFullname(message.user)}
                      </span>
                      <span className="text-gray-700">
                        <FormattedDate
                          year="numeric"
                          month="long"
                          day="numeric"
                          value={message.created_at}
                        />
                        {', '}
                        <FormattedTime value={message.created_at} />
                      </span>
                    </div>
                    <p>{message.content}</p>
                    {message.attachments.length > 0 ? (
                      <div className="space-y-2" style={{ width: '28rem' }}>
                        <h5 id={seed('message-attachments-list')}>
                          <FormattedMessage {...messages.attachmentsTitle} />
                        </h5>
                        <AttachmentsList
                          attachments={message.attachments}
                          labelId={seed('message-attachments-list')}
                        />
                      </div>
                    ) : null}
                  </article>
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
            {data!.count === 0 && messageQueue.length === 0 ? (
              <div className="px-8 py-4 bg-gray-200">
                {referral.users
                  .map((user) => user.id)
                  .includes(currentUser?.id || '$' /* impossible id */) ? (
                  <>
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
                                  (list, unitOwners) => [
                                    ...list,
                                    ...unitOwners,
                                  ],
                                  [],
                                )
                                .map((unitOwner) => getUserFullname(unitOwner))
                                .join(', ')}
                            </b>
                          ),
                        }}
                      />
                    ) : referral.assignees.length === 1 ? (
                      <FormattedMessage
                        {...messages.sendToAssignee}
                        values={{
                          assignee: (
                            <b>{getUserFullname(referral.assignees[0])}</b>
                          ),
                        }}
                      />
                    ) : (
                      <FormattedMessage
                        {...messages.sendToAssignees}
                        values={{
                          assignees: (
                            <b>
                              {referral.assignees
                                .map((assignee) => getUserFullname(assignee))
                                .join(', ')}
                            </b>
                          ),
                        }}
                      />
                    )}
                  </>
                ) : (
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
                )}
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
                            !event.shiftKey &&
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
          </form>
        </div>
      );
  }
};
