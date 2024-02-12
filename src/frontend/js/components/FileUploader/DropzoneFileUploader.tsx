import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { MessageDescriptor } from '@formatjs/ts-transformer';
import { Spinner } from 'components/Spinner';
import { ArrowUpIcon } from 'components/Icons';
import { ErrorResponse, ReferralReportVersion } from 'types';
import { useAddVersion } from '../../data/versions';

const messages = defineMessages({
  dropzone: {
    defaultMessage: 'Drag and drop some files here, or click to select files',
    description:
      'Helper text in the file dropzone input in the attachments form field.',
    id: 'components.DropzoneFileUploader.dropzone',
  },
  dropzoneCta: {
    defaultMessage: 'Select file',
    description:
      'Additional button in the file dropzone to let users open a file explorer',
    id: 'components.DropzoneFileUploader.dropzoneCta',
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
  withButton,
  url,
  keyValues = [],
  message,
}: {
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
  withButton?: boolean;
  action: string;
  url: string;
  keyValues?: [string, string | File | string[]][];
  message?: MessageDescriptor;
}) => {
  const seed = useUIDSeed();
  const [progression, setProgression] = useState<number>(0);
  const mutation = useAddVersion(url, 'referrals');

  const onDrop = (acceptedFiles: File[]) => {
    mutation.mutate(
      [
        ...keyValues,
        ...(acceptedFiles.map((file) => {
          return ['files', file];
        }) as [string, File][]),
      ],
      {
        onError: (error: ErrorResponse) => onError(error as ErrorResponse),
        onSuccess: (version: ReferralReportVersion) => {
          onSuccess(version);
        },
      },
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });
  const dropzoneMessage = message ?? messages.dropzone;
  const isLoading = (progression: number) =>
    progression > 0 && progression <= 100;

  return (
    <div
      className={`dropzone cursor-pointer ${
        isDragActive ? 'border-gray-500' : 'border-gray-400'
      } ${isLoading(progression) ? 'dropzone-disabled' : ''}`}
      {...getRootProps()}
    >
      <input
        {...getInputProps()}
        autoComplete={undefined}
        aria-labelledby={seed('attachments-list')}
      />
      {isLoading(progression) ? (
        <Spinner>
          <span className="offscreen">
            <FormattedMessage {...messages.uploadingFile} />
          </span>
        </Spinner>
      ) : (
        <div className="flex flex-col items-center">
          <p
            id={seed('attachments-list')}
            className={`text-gray-400 ${
              withButton ? 'mb-2' : 'mb-0'
            } whitespace-pre-line text-center`}
          >
            <FormattedMessage {...dropzoneMessage} />
          </p>
          {withButton && (
            <div
              className={`btn btn-gray relative rounded-sm pt-1 pb-1 pr-2 pl-2 flex space-y-2 items-center`}
            >
              <ArrowUpIcon />
              <FormattedMessage {...messages.dropzoneCta} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
