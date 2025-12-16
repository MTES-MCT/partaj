import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { MessageDescriptor } from '@formatjs/ts-transformer';
import { Spinner } from 'components/Spinner';
import { ArrowUpIcon } from 'components/Icons';
import { ErrorResponse, ReferralReportVersion } from 'types';
import { useAddVersion } from '../../data/versions';
import { FileLoadingState } from './FileLoadingState';
import { PlusIcon } from 'lucide-react';

const messages = defineMessages({
  dropzone: {
    defaultMessage: 'Drag and drop some files here, or click to select files',
    description:
      'Helper text in the file dropzone input in the attachments form field.',
    id: 'components.DropzoneFileUploader.dropzone',
  },
  dropzoneCta: {
    defaultMessage: 'SelectableList file',
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
      className={`dropzone relative cursor-pointer ${
        isDragActive ? 'border-gray-500' : 'border-black'
      } ${mutation.isLoading ? 'dropzone-disabled' : ''}`}
      {...getRootProps()}
    >
      {mutation.isLoading && <FileLoadingState />}
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
            className={`${
              withButton ? 'mb-2' : 'mb-0'
            } whitespace-pre-line text-center text-sm max-w-xl`}
          >
            <FormattedMessage {...dropzoneMessage} />
          </p>
          {withButton && (
            <div
              className={`btn bg-grey-100 text-sm space-x-2 relative border border-black py-1 px-2 flex items-center `}
            >
              <span>
                {' '}
                <FormattedMessage {...messages.dropzoneCta} />{' '}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
