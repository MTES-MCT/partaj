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

  return (
    <>
      <tr
        data-testid="version"
        key={version.id}
        className={`stretched-link-container relative`}
      >
        <td> Version {index + 1}</td>
        <td>
          <FormattedDate
            year="numeric"
            month="long"
            day="numeric"
            value={version.updated_at}
          />
        </td>
        <td>
          <p>
            {version.created_by.first_name} {version.created_by.last_name}
          </p>
          <p>{version.created_by.unit_name}</p>
        </td>
        <td>
          <a
            className="text-primary-500 hover:underline focus:underline"
            href={version.document.file}
            key={version.document.id}
          >
            {version.document.name_with_extension}
          </a>
        </td>
        <td>
          {versionsLength === index + 1 && (
            <div className="flex space-x-4">
              {!referralIsPublished(referral) && (
                <>
                  {isAuthor(currentUser, version) && (
                    <div data-testid="update-version-button">
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
                  <button
                    data-testid="send-report"
                    onClick={() => {
                      setModalOpen(true);
                      setActiveVersion(index + 1);
                    }}
                  >
                    Envoyer
                  </button>
                </>
              )}
            </div>
          )}
        </td>
      </tr>
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
