import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { Attachment } from 'types';
import { sendFile } from '../../utils/sendFile';
import { MessageDescriptor } from '@formatjs/ts-transformer';

const messages = defineMessages({
  dropzone: {
    defaultMessage: 'Drag and drop some files here, or click to select files',
    description:
      'Helper text in the file dropzone input in the attachments form field.',
    id: 'components.DropzoneFileUploader.dropzone',
  },
  loadingReport: {
    defaultMessage: 'Loading report...',
    description:
      'Accessibility message for the spinner while loading the referral report',
    id: 'components.DropzoneFileUploader.loadingAnswer',
  },
  uploadingFile: {
    defaultMessage: 'Uploading file...',
    description:
      'Accessible alternative for the spinner for an answer attachment file upload in process.',
    id: 'components.DropzoneFileUploader.uploadingFile',
  },
});

export const DropzoneFileUploader = ({
  onSuccess,
  onError,
  action,
  url,
  keyValues,
  message,
}: {
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
  action: string;
  url: string;
  keyValues?: [string, string];
  message?: MessageDescriptor;
}) => {
  const seed = useUIDSeed();
  const [progression, setProgression] = useState<number>(0);
  const onDrop = (acceptedFiles: File[]) => {
    sendAttachment({
      files: acceptedFiles,
      onError,
      onSuccess,
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  const dropzoneMessage = message ? message : messages.dropzone;
  const isLoading = (progression: number) =>
    progression > 0 && progression <= 100;

  const sendAttachment = async ({
    files,
    onSuccess,
    onError,
  }: {
    files: File[];
    onSuccess: (attachment: Attachment) => void;
    onError: (error: any) => void;
  }) => {
    const send_files = files.map((file) => ['files', file] as [string, File]);
    const keyValuePairs: [string, string | File][] = keyValues
      ? [keyValues, ...send_files]
      : [...send_files];

    try {
      const attachment = await sendFile<any>({
        headers: { Authorization: `Token ${appData.token}` },
        keyValuePairs,
        url,
        action: action,
        setProgress: (prevProgress) => {
          setProgression(prevProgress);
        },
      });
      onSuccess(attachment);
      setProgression(0);
    } catch (error) {
      onError(error);
    }
  };

  return (
    <div
      role="button"
      className={`dropzone ${
        isDragActive ? 'border-gray-500' : 'border-gray-400'
      } ${isLoading(progression) && 'dropzone-disabled'}`}
      {...getRootProps()}
    >
      <input {...getInputProps()} aria-labelledby={seed('attachments-list')} />
      {isLoading(progression) ? (
        <Spinner>
          <span className="offscreen">
            <FormattedMessage {...messages.uploadingFile} />
          </span>
        </Spinner>
      ) : (
        <p className="text-gray-400">
          <FormattedMessage {...dropzoneMessage} />
        </p>
      )}
    </div>
  );
};
