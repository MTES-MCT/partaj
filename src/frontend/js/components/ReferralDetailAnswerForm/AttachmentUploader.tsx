import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import filesize from 'filesize';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQueryCache } from 'react-query';
import { assign, Machine } from 'xstate';

import { Spinner } from 'components/Spinner';
import { ReferralAnswerAttachment } from 'types';
import { ContextProps } from 'types/context';
import { sendForm } from 'utils/sendForm';

const size = filesize.partial({
  locale: document.querySelector('html')?.getAttribute('lang') || 'en-US',
});

const messages = defineMessages({
  uploadingFile: {
    defaultMessage: 'Uploading {fileName}...',
    description:
      'Accessible alternative for the spinner for an answer attachment file upload in process.',
    id: 'components.ReferralDetailAnswerForm.AttachmentUploader.uploadingFile',
  },
});

interface sendFormMachineContext {
  progress: number;
}

const sendFormMachine = Machine<sendFormMachineContext>({
  context: {
    progress: 0,
  },
  id: 'sendFormMachine',
  initial: 'loading',
  states: {
    loading: {
      invoke: {
        id: 'sendForm',
        src: 'sendForm',
      },
      on: {
        FORM_FAILURE: {
          actions: 'handleError',
          target: 'failure',
        },
        FORM_SUCCESS: {
          actions: ['invalidateRelatedQueries', 'onDone'],
          target: 'success',
        },
        UPDATE_PROGRESS: {
          actions: assign({ progress: (_, event) => event.progress }),
        },
      },
    },
    success: {
      type: 'final',
    },
    failure: {},
  },
});

interface AttachmentUploaderProps {
  answerId: string;
  file: File;
  onDone: (file: File, attachment: ReferralAnswerAttachment) => void;
}

export const AttachmentUploader: React.FC<
  AttachmentUploaderProps & ContextProps
> = ({ answerId, context, file, onDone }) => {
  const queryCache = useQueryCache();

  const [state] = useMachine(sendFormMachine, {
    actions: {
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateRelatedQueries: () => {
        setTimeout(() => {
          queryCache.invalidateQueries(['referralanswers', answerId]);
        }, 80);
      },
      onDone: (_, event) => {
        onDone(file, event.data);
      },
    },
    services: {
      sendForm: () => async (callback) => {
        try {
          const attachment = await sendForm<any>({
            headers: { Authorization: `Token ${context.token}` },
            keyValuePairs: [
              ['answer', answerId],
              ['files', file],
            ],
            setProgress: (progress) =>
              callback({ type: 'UPDATE_PROGRESS', progress }),
            url: `/api/referralanswerattachments/`,
          });
          callback({ type: 'FORM_SUCCESS', data: attachment });
        } catch (error) {
          callback({ type: 'FORM_FAILURE', data: error });
        }
      },
    },
  });
  return (
    <li className="list-group-item justify-between">
      <span>
        {file.name} — {size(file.size)}
      </span>
      {state.matches('loading') ? (
        <span className="flex justify-center">
          {state.context.progress < 100 ? (
            `${state.context.progress}%`
          ) : (
            <Spinner>
              <span className="offscreen">
                <FormattedMessage
                  {...messages.uploadingFile}
                  values={{ fileName: file.name }}
                />
              </span>
            </Spinner>
          )}
        </span>
      ) : null}
    </li>
  );
};
