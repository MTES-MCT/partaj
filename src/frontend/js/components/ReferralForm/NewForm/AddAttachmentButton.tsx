import React, { ReactNode, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { useAddReferralAttachment } from '../../../data/referralattachment';
import { ErrorResponse, ReferralAttachment } from '../../../types';

const messages = defineMessages({
  messageAttachmentButton: {
    defaultMessage: 'Choose attachments',
    description: 'Accessible label for the attachments button.',
    id: 'components.AddAttachmentButton.messageAttachmentButton',
  },
});

export const AddAttachmentButton = ({
  onSuccess,
  onError,
  children,
  icon,
  className = '',
  disabled = false,
  disabledText = '',
  referralId,
}: {
  icon?: ReactNode;
  className?: string;
  referralId: string;
  onSuccess: (result: any) => void;
  onError: (error: ErrorResponse) => void;
  onLoad?: () => void;
  disabled?: boolean;
  disabledText?: string;
  children: React.ReactNode;
}) => {
  const seed = useUIDSeed();
  const [isLoading, setIsLoading] = useState(false);
  const mutation = useAddReferralAttachment();
  const onDrop = (acceptedFiles: File[]) => {
    setIsLoading(true);
    const keyValueFiles: [string, File][] = [];

    acceptedFiles.forEach((file) => {
      keyValueFiles.push(['files', file]);
    });

    mutation.mutate([...keyValueFiles, ['referral', referralId]], {
      onError: (error: ErrorResponse) => {
        setIsLoading(false);
        return onError(error as ErrorResponse);
      },

      onSuccess: (attachment: ReferralAttachment) => {
        onSuccess(attachment);
        setIsLoading(false);
      },
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <button
      type="button"
      {...getRootProps()}
      className={`btn bg-grey-100 text-sm font-light relative border border-black py-1 px-2 flex items-center ${className}`}
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
