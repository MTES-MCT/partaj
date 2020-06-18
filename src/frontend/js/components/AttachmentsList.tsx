import filesize from 'filesize';
import React from 'react';

import { Attachment } from 'types';

interface AttachmentsListProps {
  attachments: Attachment[];
  labelId: string;
}

const size = filesize.partial({
  locale: document.querySelector('html')?.getAttribute('lang') || 'en-US',
});

export const AttachmentsList: React.FC<AttachmentsListProps> = ({
  attachments,
  labelId,
}) => (
  <div role="group" className="file-list" aria-labelledby={labelId}>
    {attachments.map((attachment) => (
      <a
        className="file-list-item focus:bg-gray-200 hover:text-blue-600 focus:text-blue-600 hover:underline focus:underline"
        href={attachment.file}
        key={attachment.id}
      >
        {attachment.name_with_extension}
        {attachment.size ? ` — ${size(attachment.size)}` : null}
      </a>
    ))}
  </div>
);
