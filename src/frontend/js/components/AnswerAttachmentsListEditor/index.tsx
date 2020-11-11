import filesize from 'filesize';
import React from 'react';

import { ReferralAnswerAttachment } from 'types';
import { ContextProps } from 'types/context';
import { DeleteButton } from './DeleteButton';

const size = filesize.partial({
  locale: document.querySelector('html')?.getAttribute('lang') || 'en-US',
});

interface AnswerAttachmentsListEditorProps {
  answerId: string;
  attachments: ReferralAnswerAttachment[];
  labelId: string;
}

export const AnswerAttachmentsListEditor: React.FC<
  AnswerAttachmentsListEditorProps & ContextProps
> = ({ answerId, attachments, context, labelId }) => {
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
          <DeleteButton {...{ answerId, context, attachment }} />
        </div>
      ))}
    </div>
  );
};
