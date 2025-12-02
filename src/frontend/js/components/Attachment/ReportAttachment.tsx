import React, { PropsWithChildren } from 'react';
import { ReferralReportAttachment } from '../../types';
import { DownloadIcon } from '../Icons';

interface ReportAttachmentProps {
  document: ReferralReportAttachment;
  readonly?: boolean;
}

const DocumentTag: React.FC<PropsWithChildren<ReportAttachmentProps>> = ({
  document,
  readonly,
  children,
}) => {
  return readonly ? (
    <div className="flex w-full items-center justify-between">{children}</div>
  ) : (
    <a
      className="flex w-full items-center justify-between focus:border"
      href={document.file}
      key={document.id}
    >
      {children}
    </a>
  );
};

export const ReportAttachment: React.FC<ReportAttachmentProps> = ({
  document,
  readonly = false,
}) => {
  const getFileName = (fileFullName: string) => {
    const splittedFileName = fileFullName.split('.');
    splittedFileName.pop();

    return splittedFileName.join('.');
  };

  const getFileExtension = (fileFullName: string) => {
    return `.${fileFullName.split('.').pop()}`;
  };

  return (
    <div
      className={`border border-dsfr-grey-500 ${
        readonly ? 'mt-2' : 'version-document mt-2'
      }`}
    >
      <DocumentTag document={document} readonly={readonly}>
        <div className="flex w-full text-sm">
          <span className="pt-1 pb-1 pr-2 pl-2">
            {getFileExtension(document.name_with_extension)}
          </span>
          <span
            className={`pt-1 pb-1 ${
              readonly ? 'pr-2' : 'pr-8'
            } pl-2 w-full truncate`}
          >
            {getFileName(document.name_with_extension)}
          </span>
        </div>
        {!readonly && (
          <span className="items-center pr-2 pl-2">
            <DownloadIcon />
          </span>
        )}
      </DocumentTag>
    </div>
  );
};
