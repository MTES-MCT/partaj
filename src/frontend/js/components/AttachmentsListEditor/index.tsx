import filesize from 'filesize';
import React from 'react';

import { DeleteButton } from './DeleteButton';
import { Attachment } from 'types';

const size = filesize.partial({
  locale: document.querySelector('html')?.getAttribute('lang') || 'en-US',
});

interface AttachmentsListEditorProps {
  ObjetAttachmentId: string;
  attachments: Attachment[];
  labelId: string;
  objectName: string;
}

export const AttachmentsListEditor: React.FC<AttachmentsListEditorProps> = ({
  ObjetAttachmentId,
  attachments,
  labelId,
  objectName,
}) => {
  return (
    <div role="group" className="list-group" aria-labelledby={labelId}>
      {attachments.map((attachment) => (
        <div
          className="list-group-item focus:bg-gray-200 hover:underline focus:underline flex justify-between"
          key={attachment.id}
        >
          <span>
            {attachment.name_with_extension}
            {attachment.size ? ` — ${size(attachment.size)}` : null}
          </span>
          <DeleteButton
            ObjetAttachmentId={ObjetAttachmentId}
            attachment={attachment}
            objectName={objectName}
          />
        </div>
      ))}
    </div>
  );
};
