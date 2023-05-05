import React, { useContext, useState } from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { ReferralReport, ReferralReportVersion } from '../../types';
import { urls } from '../../const';
import { useCurrentUser } from '../../data/useCurrentUser';
import { isAuthor } from '../../utils/version';
import { SendVersionModal } from './SendVersionModal';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { referralIsPublished } from '../../utils/referral';
import { EditFileIcon, IconColor, SendIcon } from '../Icons';
import { FileUploaderButton } from '../FileUploader/FileUploaderButton';
import { IconTextButton } from '../buttons/IconTextButton';
import { VersionDocument } from './VersionDocument';

interface VersionProps {
  report: ReferralReport | undefined;
  version: ReferralReportVersion;
  index: number;
  versionsLength: number;
  onUpdateSuccess: (result: ReferralReportVersion, index: number) => void;
  onUpdateError: (error: any) => void;
}

const messages = defineMessages({
  publicationDate: {
    defaultMessage: 'Publication date { date }',
    description: 'Title for the version publication date.',
    id: 'components.Version.publicationDate',
  },
  send: {
    defaultMessage: 'Send to requester(s)',
    description: 'Title for the version send button.',
    id: 'components.Version.send',
  },
  replace: {
    defaultMessage: 'Replace',
    description: 'Title for the version replace button.',
    id: 'components.Version.replace',
  },
});

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

  const isLastVersion = (index: number) => {
    /** Check if index equal zero as last version is first returned by API (ordering=-created_at)**/
    return index === 0;
  };

  return (
    <>
      <div
        data-testid="version"
        key={version.id}
        className={`flex w-full flex-col relative bg-white p-3 rounded border border-gray-300`}
      >
        <div className={`flex justify-between text-lg font-medium`}>
          <span>Version {versionsLength - index}</span>
          <span>
            {version.created_by.first_name} {version.created_by.last_name}
          </span>
        </div>

        <div className={`flex justify-between text-sm text-gray-500`}>
          <FormattedMessage
            {...messages.publicationDate}
            values={{
              date: (
                <FormattedDate
                  year="numeric"
                  month="long"
                  day="numeric"
                  value={version.updated_at}
                />
              ),
            }}
          />
          <div>
            <p>{version.created_by.unit_name}</p>
          </div>
        </div>
        <VersionDocument version={version} />
        {isLastVersion(index) && !referralIsPublished(referral) && (
          <div className="flex w-full relative h-8 items-center mt-4">
            {isAuthor(currentUser, version) && (
              <div
                className="absolute left-0"
                data-testid="update-version-button"
              >
                <FileUploaderButton
                  icon={<EditFileIcon />}
                  cssClass="gray"
                  onSuccess={(result) => {
                    onUpdateSuccess(result, index);
                  }}
                  onError={(error) => onUpdateError(error)}
                  action={'PUT'}
                  url={urls.versions + version.id + '/'}
                >
                  <FormattedMessage {...messages.replace} />
                </FileUploaderButton>
              </div>
            )}

            <div className="absolute right-0">
              <IconTextButton
                testId="send-report-button"
                otherClasses="btn-primary"
                icon={<SendIcon color={IconColor.WHITE} />}
                onClick={() => {
                  setModalOpen(true);
                  setActiveVersion(versionsLength - index);
                }}
              >
                <FormattedMessage {...messages.send} />
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
