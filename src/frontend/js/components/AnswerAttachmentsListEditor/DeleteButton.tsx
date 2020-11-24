import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useQueryCache } from 'react-query';
import { useUIDSeed } from 'react-uid';
import { Machine } from 'xstate';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { ReferralAnswerAttachment } from 'types';

const messages = defineMessages({
  delete: {
    defaultMessage: 'Remove { name }',
    description:
      'Accessible text for delete icons in the list of attachments in an editable attachments list.',
    id: 'components.AnswerAttachmentsListEditor.delete',
  },
});

const deleteAttachmentMachine = Machine({
  id: 'deleteAttachmentMachine',
  initial: 'idle',
  states: {
    idle: {
      on: {
        DELETE: 'loading',
      },
    },
    loading: {
      invoke: {
        id: 'deleteAttachment',
        onDone: { target: 'success', actions: 'invalidateRelatedQueries' },
        onError: { target: 'failure', actions: 'handleError' },
        src: 'deleteAttachment',
      },
    },
    failure: {
      on: {
        DELETE: 'loading',
      },
    },
    success: {
      type: 'final',
    },
  },
});

interface DeleteButtonProps {
  answerId: string;
  attachment: ReferralAnswerAttachment;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  answerId,
  attachment,
}) => {
  const queryCache = useQueryCache();
  const intl = useIntl();
  const seed = useUIDSeed();

  const [state, send] = useMachine(deleteAttachmentMachine, {
    actions: {
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateRelatedQueries: () => {
        queryCache.invalidateQueries(['referralanswerattachments']);
        queryCache.invalidateQueries(['referralanswers', answerId]);
      },
    },
    services: {
      deleteAttachment: async () => {
        const response = await fetch(
          `/api/referralanswers/${answerId}/remove_attachment/`,
          {
            body: JSON.stringify({ attachment: attachment.id }),
            headers: {
              Authorization: `Token ${appData.token}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
          },
        );
        if (!response.ok) {
          throw new Error(
            `Failed to get remove attachment ${attachment.id} from ${answerId} in <AnswerAttachmentsListEditor />.`,
          );
        }
        return await response.json();
      },
    },
  });

  return (
    <button
      aria-busy={state.matches('loading')}
      aria-disabled={state.matches('loading')}
      aria-labelledby={seed(attachment.id)}
      className={`relative text-gray-700 hover:text-red-700 ${
        state.matches('loading') ? 'cursor-wait' : ''
      }`}
      onClick={(e) => {
        e.preventDefault();
        send('DELETE', { attachmentId: attachment.id });
      }}
    >
      {state.matches('loading') ? (
        <span aria-hidden="true">
          <Spinner size="small" />
        </span>
      ) : (
        <svg role="img" className="w-5 h-5 fill-current">
          <use xlinkHref={`${appData.assets.icons}#icon-trash`} />
          <title id={seed(attachment.id)}>
            {intl.formatMessage(messages.delete, {
              name: attachment.name_with_extension,
            })}
          </title>
        </svg>
      )}
      <div
        className="absolute"
        style={{
          top: '-10px',
          right: '-10px',
          bottom: '-10px',
          left: '-10px',
        }}
      ></div>
    </button>
  );
};
