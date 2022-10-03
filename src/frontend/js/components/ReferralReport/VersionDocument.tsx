import React from 'react';
import { ReferralReportVersion } from '../../types';
import { DownloadIcon } from '../Icons';

interface VersionDocumentProps {
  version: ReferralReportVersion;
}

export const VersionDocument: React.FC<VersionDocumentProps> = ({
  version,
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
    <div className="version-document">
      <a
        className="flex relative w-full items-center"
        href={version.document.file}
        key={version.document.id}
      >
        <div className="flex absolute left-0 w-full">
          <span className="bg-gray-300 pt-1 pb-1 pr-2 pl-2">
            {getFileExtension(version.document.name_with_extension)}
          </span>
          <span className="bg-gray-200 pt-1 pb-1 pr-8 pl-2 w-full truncate">
            {getFileName(version.document.name_with_extension)}
          </span>
        </div>
        <span className="bg-gray-200 items-center pr-2 pl-2 absolute right-0">
          <DownloadIcon />
        </span>
      </a>
    </div>
  );
};
