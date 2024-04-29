import React, { useContext, useEffect, useState } from 'react';
import { useMachine } from '@xstate/react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';
import { FilesFieldMachine, UpdateEvent } from './machines';
import { useDropzone } from 'react-dropzone';

import { AttachmentsListEditor } from 'components/AttachmentsListEditor';
import { AttachmentUploader } from '../AttachmentsListEditor/AttachmentUploader';
import { Attachment, ErrorCodes, ErrorResponse } from 'types';

import { CleanAllFieldsProps } from '.';
import { DescriptionText } from '../styled/text/DescriptionText';
import { ErrorModal } from '../modals/ErrorModal';
import { commonMessages } from '../../const/translations';
import * as Sentry from '@sentry/react';
import { ErrorModalContext } from '../../data/providers/ErrorModalProvider';

const messages = defineMessages({
  description: {
    defaultMessage:
      'Formal letter of referral, any documents necessary to understand and analyze the question, any prior work',
    description:
      'Description for the file attachments field in the referral form',
    id: 'components.ReferralForm.AttachmentsField.description',
  },
  label: {
    defaultMessage: 'File attachments',
    description: 'Label for the file attachments field in the referral form',
    id: 'components.ReferralForm.AttachmentsField.label',
  },
  dropzone: {
    defaultMessage: 'Drag and drop some files here, or click to select files',
    description:
      'Helper text in the file dropzone input in the attachments form field.',
    id: 'components.AttachmentsField.dropzone',
  },
});

interface AttachmentsFieldProps extends CleanAllFieldsProps {
  referralId: number;
  attachments: Attachment[];
  sendToParent: Sender<UpdateEvent<File[]>>;
}

export const AttachmentsField: React.FC<AttachmentsFieldProps> = ({
  referralId,
  attachments,
  cleanAllFields,
  sendToParent,
}) => {
  const seed = useUIDSeed();
  const { openErrorModal, setErrorMessage } = useContext(ErrorModalContext);
  const intl = useIntl();
  const onError = (error: ErrorResponse) => {
    if (error.code === ErrorCodes.FILE_FORMAT_FORBIDDEN) {
      setErrorMessage(
        intl.formatMessage(commonMessages.multipleErrorFileFormatText),
      );
      openErrorModal();
    }
    Sentry.captureException(error.errors[0]);
  };

  const [state, send] = useMachine(FilesFieldMachine, {
    actions: {
      setValue: assign({
        value: (_, event) => event.data,
      }),
    },
    guards: {
      isValid: () => true,
    },
  });

  useEffect(() => {
    if (cleanAllFields) {
      send('CLEAN');
    }
  }, [cleanAllFields]);

  // Send an update to the parent whenever the state or context changes
  useEffect(() => {
    sendToParent({
      payload: {
        clean: state.matches('cleaned.true'),
        data: state.context.value,
        valid: state.matches('validation.valid'),
      },
      fieldName: 'files',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  const [filesState, setFilesState] = useState<{
    attachments: Attachment[];
    files: File[];
  }>({ attachments: [], files: [] });

  const onDrop = (acceptedFiles: File[]) => {
    setFilesState((previousState) => ({
      attachments: previousState.attachments,
      files: [...previousState.files, ...acceptedFiles],
    }));
  };
  const onDone = (file: File, attachment: Attachment) => {
    setFilesState((previousState) => ({
      attachments: [...previousState.attachments, attachment],
      files: previousState.files.filter(
        (existingFile) => file !== existingFile,
      ),
    }));
  };
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <>
      <div className="mb-8">
        <label className="mb-1 font-semibold">
          <FormattedMessage {...messages.label} />
        </label>
        <DescriptionText>
          <FormattedMessage {...messages.description} />
        </DescriptionText>
        {!!attachments.length ? (
          <AttachmentsListEditor
            ObjetAttachmentId={referralId.toString()}
            objectName="referrals"
            attachments={attachments}
            labelId={seed('referral-attachments-label')}
          />
        ) : null}
        {filesState.files.length > 0 && (
          <ul className=" mt-2">
            {filesState.files.map((file) => (
              <AttachmentUploader
                file={file}
                key={seed(file)}
                objectName="referral"
                ObjetAttachmentId={referralId.toString()}
                onError={(error: ErrorResponse) => onError(error)}
              />
            ))}
          </ul>
        )}
        <button
          type="button"
          className="bg-gray-200 mt-2 py-3 px-5 border rounded text-center"
          {...getRootProps()}
        >
          <input
            {...getInputProps()}
            aria-labelledby={seed('attachments-list')}
          />
          <p>
            <FormattedMessage {...messages.dropzone} />
          </p>
        </button>
      </div>
      <ErrorModal />
    </>
  );
};
