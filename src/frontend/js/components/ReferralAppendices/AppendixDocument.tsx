import React, { PropsWithChildren } from 'react';
import { ReferralReportAppendix } from '../../types';
import { DownloadIcon } from '../Icons';

interface AppendixDocumentProps {
  appendix: ReferralReportAppendix;
  readonly?: boolean;
}

const DocumentTag: React.FC<PropsWithChildren<AppendixDocumentProps>> = ({
  appendix,
  readonly,
  children,
}) => {
  return readonly ? (
    <div className="flex w-full items-center justify-between bg-dsfr-grey-100">
      {children}
    </div>
  ) : (
    <a
      className="flex w-full items-center justify-between focus:border bg-dsfr-grey-100"
      href={appendix.document.file}
      key={appendix.document.id}
    >
      {children}
    </a>
  );
};

export const AppendixDocument: React.FC<AppendixDocumentProps> = ({
  appendix,
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
    <div className={`${readonly ? 'mt-2' : 'appendix-document mt-2'}`}>
      <DocumentTag appendix={appendix} readonly={readonly}>
        <div className="flex w-full text-sm">
          <span className="bg-dsfr-grey-200 pt-1 pb-1 pr-2 pl-2">
            {getFileExtension(appendix.document.name_with_extension)}
          </span>
          <span
            className={`pt-1 pb-1 ${
              readonly ? 'pr-2' : 'pr-8'
            } pl-2 w-full truncate`}
          >
            {getFileName(appendix.document.name_with_extension)}
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
