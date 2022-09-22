import React, { useContext, useState } from 'react';
import { FormattedDate } from 'react-intl';
import { ReferralReport, ReferralReportVersion } from '../../types';
import { urls } from '../../const';
import { useCurrentUser } from '../../data/useCurrentUser';
import { isAuthor } from '../../utils/version';
import { SendVersionModal } from './SendVersionModal';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { referralIsPublished } from '../../utils/referral';
import { ButtonFileUploader } from '../FileUploader/ButtonFileUploader';

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

  return (
    <>
      <div
        data-testid="version"
        key={version.id}
        className={`flex flex-col relative bg-white p-3 rounded`}
      >
        <div className={`flex justify-between font-medium`}>
          <span>Version {index + 1}</span>

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

        <div className={`flex items-start`}>
          <a
            className="text-primary-500 hover:underline focus:underline"
            href={version.document.file}
            key={version.document.id}
          >
            <div className="bg-purple-300">
              {getFileExtension(version.document.name_with_extension)}
            </div>
            <div>
              {getFileName(version.document.name_with_extension)}
            </div>
          </a>
        </div>
        {versionsLength === index + 1 && !referralIsPublished(referral) && (
          <div className="flex w-full relative h-8 items-center">
            {isAuthor(currentUser, version) && (
              <div className="absolute left-0" data-testid="update-version-button">
                <ButtonFileUploader
                  onSuccess={(result) => {
                    onUpdateSuccess(result, index);
                  }}
                  onError={(error) => onUpdateError(error)}
                  action={'PUT'}
                  url={urls.versions + version.id + '/'}
                >
                  Modifier
                </ButtonFileUploader>
              </div>
            )}

            <div className="absolute right-0">
              <button
                data-testid="send-report-button"
                onClick={() => {
                  setModalOpen(true);
                  setActiveVersion(index + 1);
                }}
              >
                Envoyer
              </button>
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
