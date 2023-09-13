import React, { ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { sendAttachment } from '../../data/sendAttachment';

const messages = defineMessages({
  messageAttachmentButton: {
    defaultMessage: 'Add attachments',
    description:
      'Accessible label for the attachments button in ButtonFileUploader.',
    id: 'components.ButtonFileUploader.messageAttachmentButton',
  },
});

export const FileUploaderButton = ({
  onSuccess,
  onError,
  onLoad,
  action,
  url,
  keyValues,
  children,
  cssClass = 'default',
  icon,
  disabled = false,
  disabledText = '',
}: {
  icon?: ReactNode;
  cssClass?: string;
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
  onLoad?: () => void;
  action: string;
  disabled?: boolean;
  disabledText?: string;
  url: string;
  keyValues?: [string, string][];
  children: React.ReactNode;
}) => {
  const seed = useUIDSeed();

  const onDrop = (acceptedFiles: File[]) => {
    onLoad?.();

    sendAttachment({
      action,
      url,
      keyValues,
      files: acceptedFiles,
      onError,
      onSuccess: (attachment) => {
        onSuccess(attachment);
      },
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <button
      type="button"
      {...getRootProps()}
      className={`btn btn-${cssClass} relative rounded-sm pt-1 pb-1 pr-2 pl-2 flex items-center`}
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
