import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import filesize from 'filesize';
import { useUIDSeed } from 'react-uid';
import { Attachment } from '../../types';
import { appData } from '../../appData';
import { Spinner } from '../Spinner';

const messages = defineMessages({
  delete: {
    defaultMessage: 'Remove { name }',
    description:
      'Accessible text for delete icons in the list of attachments in sending modal attachments list.',
    id: 'components.AttachmentItem.delete',
  },
});

const size = filesize.partial({
  locale: document.querySelector('html')?.getAttribute('lang') || 'en-US',
});

interface AttachmentItemProps {
  parentId: string;
  attachment: Attachment;
  onDeleteSuccess: (result: any) => void;
}

export const AttachmentItem: React.FC<AttachmentItemProps> = ({
  parentId,
  onDeleteSuccess,
  attachment,
}) => {
  const deleteAttachment = async (attachmentId: string) => {
    setDeleting(true);
    const response = await fetch(
      `/api/referralreports/${parentId}/remove_attachment/`,
      {
        body: JSON.stringify({
          attachment: attachmentId,
        }),
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );
    if (!response.ok) {
      setDeleting(false);
      throw new Error('Failed to publish version in SendVersionModal.');
    }
    setDeleting(false);
    const result = await response.json();
    onDeleteSuccess(result);
  };
  const seed = useUIDSeed();
  const intl = useIntl();
  const [isDeleting, setDeleting] = useState(false);

  return (
    <div className="list-group-item justify-between">
      <a
        className="text-primary-500 hover:underline focus:underline truncate"
        href={attachment.file}
        key={attachment.id}
      >
        {attachment.name_with_extension}
        {attachment.size ? ` — ${size(attachment.size)}` : null}
      </a>
      <button
        aria-busy={isDeleting}
        aria-disabled={isDeleting}
        aria-labelledby={seed(attachment.id)}
        className={`relative text-gray-700 hover:text-danger-700 ${
          isDeleting ? 'cursor-wait' : ''
        }`}
        onClick={(e) => {
          e.preventDefault();
          deleteAttachment(attachment.id);
        }}
      >
        {isDeleting ? (
          <span aria-hidden="true">
            <Spinner size="small" />
          </span>
        ) : (
          <svg role="presentation" className="w-5 h-5 fill-current">
            <use xlinkHref={`${appData.assets.icons}#icon-trash`} />
            <title id={seed(attachment.id)}>
              {intl.formatMessage(messages.delete, {
                name: attachment.name_with_extension,
              })}
            </title>
          </svg>
        )}
      </button>
    </div>
  );
};
