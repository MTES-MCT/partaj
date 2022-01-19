import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import filesize from 'filesize';
import React, { useState } from 'react';

import { defineMessages, FormattedMessage } from 'react-intl';
import { useQueryClient } from 'react-query';
import { assign, Machine } from 'xstate';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { Attachment } from 'types';
import { sendForm } from 'utils/sendForm';

const size = filesize.partial({
  locale: document.querySelector('html')?.getAttribute('lang') || 'en-US',
});

const messages = defineMessages({
  uploadingFile: {
    defaultMessage: 'Uploading {fileName}...',
    description:
      'Accessible alternative for the spinner for an answer attachment file upload in process.',
    id: 'components.ReferralForm.AttachmentUploader.uploadingFile',
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
  file: File;
  objectName: string;
  ObjetAttachmentId: string;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  file,
  objectName,
  ObjetAttachmentId,
}) => {
  const queryClient = useQueryClient();

  const [filesState, setFilesState] = useState<{
    attachments: Attachment[];
    files: File[];
  }>({ attachments: [], files: [] });

  const onDone = (file: File, attachment: Attachment) => {
    setFilesState((previousState) => ({
      attachments: [...previousState.attachments, attachment],
      files: previousState.files.filter(
        (existingFile) => file !== existingFile,
      ),
    }));
  };

  const [state] = useMachine(sendFormMachine, {
    actions: {
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateRelatedQueries: () => {
        queryClient.invalidateQueries([objectName + 's', ObjetAttachmentId]);
      },
      onDone: (_, event) => {
        onDone(file, event.data);
      },
    },
    services: {
      sendForm: () => async (callback) => {
        try {
          const attachment = await sendForm<any>({
            headers: { Authorization: `Token ${appData.token}` },
            keyValuePairs: [
              [objectName, ObjetAttachmentId],
              ['files', file],
            ],
            setProgress: (progress) =>
              callback({ type: 'UPDATE_PROGRESS', progress }),
            url: `/api/${objectName}attachments/`,
          });
          callback({ type: 'FORM_SUCCESS', data: attachment });
        } catch (error) {
          callback({ type: 'FORM_FAILURE', data: error });
        }
      },
    },
  });
  return (
    <li className=" justify-between">
      {state.matches('loading') ? (
        <span className="flex justify-center">
          {state.context.progress < 100 ? `${state.context.progress}%` : null}
        </span>
      ) : null}
    </li>
  );
};
