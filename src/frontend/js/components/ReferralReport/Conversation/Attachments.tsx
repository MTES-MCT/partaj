import filesize from 'filesize';
import React from 'react';
import { useUIDSeed } from 'react-uid';

import { Attachment } from 'types';

interface AttachmentsProps {
  attachments: Attachment[];
  labelId: string;
}

const size = filesize.partial({
  locale: document.querySelector('html')?.getAttribute('lang') || 'en-US',
});

export const Attachments: React.FC<AttachmentsProps> = ({
  attachments,
  labelId,
}) => (
  <div role="group" className="list-group" aria-labelledby={labelId}>
    {attachments.map((attachment) => (
      <a
        className="flex py-1 px-2 text-sm border border-gray-400 focus:bg-gray-200 hover:text-primary-500 focus:text-primary-500 hover:underline focus:underline"
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

export const Files: React.FC<FilesListProps> = ({ files, labelId }) => {
  const seed = useUIDSeed();
  return (
    <div role="group" className="list-group" aria-labelledby={labelId}>
      {files.map((file) => (
        <div
          className="flex py-1 px-2 text-sm border border-gray-400 focus:bg-gray-200 hover:text-primary-500 focus:text-primary-500 hover:underline focus:underline"
          key={seed(file)}
        >
          {`${file.name} — ${size(file.size)}`}
        </div>
      ))}
    </div>
  );
};
