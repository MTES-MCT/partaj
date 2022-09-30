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
  action,
  url,
  keyValues,
  children,
  cssClass = 'default',
  icon,
}: {
  icon?: ReactNode;
  cssClass?: string;
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
  action: string;
  url: string;
  keyValues?: [string, string];
  children: React.ReactNode;
}) => {
  const seed = useUIDSeed();
  const onDrop = (acceptedFiles: File[]) => {
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
      className={`btn btn-${cssClass} rounded-sm pt-1 pb-1 pr-2 pl-2 flex items-center`}
      aria-labelledby={seed('message-attachment-button')}
    >
      {icon && <div className="mr-2">{icon}</div>}
      <input {...getInputProps()} />
      {children ?? <FormattedMessage {...messages.messageAttachmentButton} />}
    </button>
  );
};
