import React, { ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { ErrorResponse, ReferralReportVersion } from '../../types';
import { useUpdateVersion } from '../../data/versions';

const messages = defineMessages({
  messageAttachmentButton: {
    defaultMessage: 'Add attachments',
    description:
      'Accessible label for the attachments button in ButtonFileUploader.',
    id: 'components.ButtonFileUploader.messageAttachmentButton',
  },
});

export const VersionUpdateButton = ({
  onSuccess,
  onError,
  url,
  children,
  cssClass = 'btn-default',
  icon,
  disabled = false,
  disabledText = '',
}: {
  icon?: ReactNode;
  cssClass?: string;
  onSuccess: (result: any) => void;
  onError: (error: ErrorResponse) => void;
  onLoad?: () => void;
  action: string;
  disabled?: boolean;
  disabledText?: string;
  url: string;
  keyValuePairs?: [string, string][];
  children: React.ReactNode;
}) => {
  const seed = useUIDSeed();
  const mutation = useUpdateVersion(url, 'referrals');

  const onDrop = (acceptedFiles: File[]) => {
    const keyValueFiles: [string, File][] = [];
    acceptedFiles.forEach((file) => {
      keyValueFiles.push(['files', file]);
    });

    mutation.mutate([...keyValueFiles], {
      onError: (error: ErrorResponse) => onError(error as ErrorResponse),
      onSuccess: (version: ReferralReportVersion) => {
        onSuccess(version);
      },
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <button
      type="button"
      {...getRootProps()}
      className={`btn ${cssClass} relative rounded-sm pt-1 pb-1 pr-2 pl-2 flex items-center`}
      disabled={disabled}
      aria-labelledby={seed('message-attachment-button')}
      data-disabled={disabledText}
    >
      {icon && <div className={`mr-2`}>{icon}</div>}
      <input {...getInputProps()} />
      {children ?? <FormattedMessage {...messages.messageAttachmentButton} />}
    </button>
  );
};
