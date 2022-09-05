import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { Attachment } from 'types';
import { sendFile } from '../../utils/sendFile';
import { MessageDescriptor } from '@formatjs/ts-transformer';
import { sendAttachment } from '../../data/sendAttachment';

const messages = defineMessages({
  messageAttachmentButton: {
    defaultMessage: 'Add attachments',
    description:
      'Accessible label for the attachments button in ButtonFileUploader.',
    id: 'components.ButtonFileUploader.messageAttachmentButton',
  },
});

export const ButtonFileUploader = ({
  onSuccess,
  onError,
  action,
  url,
  keyValues,
  children,
}: {
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
      className="p-2 text-black"
      aria-labelledby={seed('message-attachment-button')}
    >
      <input {...getInputProps()} />
      {children ?? <FormattedMessage {...messages.messageAttachmentButton} />}
    </button>
  );
};
