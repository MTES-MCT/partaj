import React, { PropsWithChildren } from 'react';
import { ReferralReportVersion } from '../../types';
import { DownloadIcon } from '../Icons';

interface VersionDocumentProps {
  version: ReferralReportVersion;
  readonly?: boolean;
}

const DocumentTag: React.FC<PropsWithChildren<VersionDocumentProps>> = ({
  version,
  readonly,
  children,
}) => {
  return readonly ? (
    <div className="flex w-full items-center justify-between bg-gray-200">
      {children}
    </div>
  ) : (
    <a
      className="flex w-full items-center justify-between bg-gray-200"
      href={version.document.file}
      key={version.document.id}
    >
      {children}
    </a>
  );
};

export const VersionDocument: React.FC<VersionDocumentProps> = ({
  version,
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
    <div className={`${readonly ? 'mt-2' : 'version-document mt-2'}`}>
      <DocumentTag version={version} readonly={readonly}>
        <div className="flex w-full text-sm">
          <span className="bg-gray-300 pt-1 pb-1 pr-2 pl-2">
            {getFileExtension(version.document.name_with_extension)}
          </span>
          <span
            className={`bg-gray-200 pt-1 pb-1 ${
              readonly ? 'pr-2' : 'pr-8'
            } pl-2 w-full truncate`}
          >
            {getFileName(version.document.name_with_extension)}
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
