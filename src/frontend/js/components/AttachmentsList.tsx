import filesize from 'filesize';
import React from 'react';
import { useUIDSeed } from 'react-uid';

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
  <div role="group" className="list-group" aria-labelledby={labelId}>
    {attachments.map((attachment) => (
      <a
        className="list-group-item focus:bg-gray-200 hover:text-primary-500 focus:text-primary-500 hover:underline focus:underline"
        href={attachment.file}
        key={attachment.id}
      >
        {attachment.name_with_extension}
        {attachment.size ? ` — ${size(attachment.size)}` : null}
      </a>
    ))}
  </div>
);

interface FilesListProps {
  files: File[];
  labelId: string;
}

export const FilesList: React.FC<FilesListProps> = ({ files, labelId }) => {
  const seed = useUIDSeed();
  return (
    <div role="group" className="list-group" aria-labelledby={labelId}>
      {files.map((file) => (
        <div
          className="list-group-item focus:bg-gray-200 hover:text-primary-500 focus:text-primary-500 hover:underline focus:underline"
          key={seed(file)}
        >
          {`${file.name} — ${size(file.size)}`}
        </div>
      ))}
    </div>
  );
};
