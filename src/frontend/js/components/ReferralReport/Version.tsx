import React, { useContext, useState } from 'react';
import { FormattedDate } from 'react-intl';
import { ReferralReport, ReferralReportVersion } from '../../types';
import { urls } from '../../const';
import { useCurrentUser } from '../../data/useCurrentUser';
import { isAuthor } from '../../utils/version';
import { SendVersionModal } from './SendVersionModal';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { referralIsPublished } from '../../utils/referral';
import { DownloadIcon, EditIcon, SendIcon } from '../Icons';
import { FileUploaderButton } from '../FileUploader/FileUploaderButton';
import { IconTextButton } from '../buttons/IconTextButton';

interface VersionProps {
  report: ReferralReport | undefined;
  version: ReferralReportVersion;
  index: number;
  versionsLength: number;
  onUpdateSuccess: (result: ReferralReportVersion, index: number) => void;
  onUpdateError: (error: any) => void;
}

export const Version: React.FC<VersionProps> = ({
  report,
  version,
  index,
  versionsLength,
  onUpdateSuccess,
  onUpdateError,
}) => {
  const { referral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();
  const [isModalOpen, setModalOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState(0);

  const getFileName = (fileFullName: string) => {
    const splittedFileName = fileFullName.split('.');
    splittedFileName.pop();

    return splittedFileName.join('.');
  };

  const getFileExtension = (fileFullName: string) => {
    return `.${fileFullName.split('.').pop()}`;
  };

  const isLastVersion = (index: number) => {
    /** Check if index equal zero as last version is first returned by API (ordering=-created_at)**/
    return index === 0;
  };

  return (
    <>
      <div
        data-testid="version"
        key={version.id}
        className={`flex flex-col relative bg-white p-3 rounded border border-gray-300`}
      >
        <div className={`flex justify-between text-lg font-medium`}>
          <span>Version {versionsLength - index}</span>

          <span>
            {version.created_by.first_name} {version.created_by.last_name}
          </span>
        </div>

        <div className={`flex justify-between text-sm text-gray-500`}>
          <FormattedDate
            year="numeric"
            month="long"
            day="numeric"
            value={version.updated_at}
          />
          <div>
            <p>{version.created_by.unit_name}</p>
          </div>
        </div>

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
              <span className="bg-gray-200 pt-1 pb-1 pr-8 pl-2 w-full">
                {getFileName(version.document.name_with_extension)}
              </span>
            </div>
            <span className="bg-gray-200 items-center pr-2 pl-2 absolute right-0">
              <DownloadIcon />
            </span>
          </a>
        </div>

        {isLastVersion(index) && !referralIsPublished(referral) && (
          <div className="flex w-full relative h-8 items-center mt-4">
            {isAuthor(currentUser, version) && (
              <div
                className="absolute left-0"
                data-testid="update-version-button"
              >
                <FileUploaderButton
                  icon={<EditIcon />}
                  cssClass="gray"
                  onSuccess={(result) => {
                    onUpdateSuccess(result, index);
                  }}
                  onError={(error) => onUpdateError(error)}
                  action={'PUT'}
                  url={urls.versions + version.id + '/'}
                >
                  Modifier
                </FileUploaderButton>
              </div>
            )}

            <div className="absolute right-0">
              <IconTextButton
                data-testid="send-report-button"
                cssClass="primary"
                icon={<SendIcon color="white" />}
                onClick={() => {
                  setModalOpen(true);
                  setActiveVersion(versionsLength - index);
                }}
              >
                Envoyer
              </IconTextButton>
            </div>
          </div>
        )}
      </div>
      <SendVersionModal
        report={report}
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
        version={version}
        activeVersion={activeVersion}
      />
    </>
  );
};
