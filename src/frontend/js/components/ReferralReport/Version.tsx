import React, { useContext, useState } from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import {
  ReferralReport,
  ReferralReportVersion,
  ReportEventVerb,
} from '../../types';
import { urls } from '../../const';
import { useCurrentUser } from '../../data/useCurrentUser';
import { isAuthor } from '../../utils/version';
import { SendVersionModal } from './SendVersionModal';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { referralIsPublished } from '../../utils/referral';
import { EditFileIcon, IconColor, SendIcon, ValidationIcon } from '../Icons';
import { FileUploaderButton } from '../FileUploader/FileUploaderButton';
import { IconTextButton } from '../buttons/IconTextButton';
import { VersionDocument } from './VersionDocument';
import { VersionEventIndicator } from './VersionEventIndicator';
import { VersionContext } from '../../data/providers/VersionProvider';
import { ValidationModal } from '../modals/ValidationModal';
import { ValidationSelect } from '../select/ValidationSelect';
import { ValidateModal } from '../modals/ValidateModal';
import { RequestChangeModal } from '../modals/RequestChangeModal';
import * as Sentry from '@sentry/react';
import { isGranted } from '../../utils/user';

interface VersionProps {
  report: ReferralReport | undefined;
  index: number;
  versionsLength: number;
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
  requestValidation: {
    defaultMessage: 'Request validation',
    description: 'Request validation button text',
    id: 'components.Version.requestValidation',
  },
  validationRequested: {
    defaultMessage: 'Validation requested',
    description: 'Validation requested button text',
    id: 'components.Version.validationRequested',
  },
});

export const Version: React.FC<VersionProps> = ({
  report,
  index,
  versionsLength,
}) => {
  const { referral } = useContext(ReferralContext);
  const { version, setVersion } = useContext(VersionContext);
  const { currentUser } = useCurrentUser();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isValidationModalOpen, setValidationModalOpen] = useState(false);
  const [isValidateModalOpen, setValidateModalOpen] = useState(false);
  const [isRequestChangeModalOpen, setRequestChangeModalOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState(0);
  const versionNumber = version?.version_number ?? versionsLength - index;

  const isLastVersion = (index: number) => {
    /** Check if index equal zero as last version is first returned by API (ordering=-created_at)**/
    return index === 0;
  };

  const isValidating = (version: ReferralReportVersion) => {
    return (
      version.events.filter(
        (reportEvent) =>
          reportEvent.verb === ReportEventVerb.REQUEST_VALIDATION,
      ).length > 0
    );
  };

  return (
    <>
      {referral && version && (
        <>
          <div
            data-testid="version"
            key={version.id}
            className={`flex w-full flex-col relative bg-white p-3 rounded border border-gray-300 space-y-8`}
          >
            <div className="space-y-1">
              {version.events.length > 0 && referral.validation_state === 1 && (
                <div className="space-y-1 mb-2">
                  {version.events.map((event) => (
                    <VersionEventIndicator
                      key={event.id}
                      version={version}
                      event={event}
                      isActive={isLastVersion(index)}
                    />
                  ))}
                </div>
              )}
              <div className={`flex justify-between font-medium`}>
                <span>Version {versionNumber}</span>
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
            </div>

            {isLastVersion(index) && !referralIsPublished(referral) && (
              <div className="flex w-full items-center justify-between">
                <div>
                  {isAuthor(currentUser, version) && (
                    <div
                      className="flex space-x-2"
                      data-testid="update-version-button"
                    >
                      <FileUploaderButton
                        icon={<EditFileIcon />}
                        cssClass="gray"
                        onSuccess={(result) => {
                          setVersion(result);
                        }}
                        onError={(error) => Sentry.captureException(error)}
                        action={'PUT'}
                        url={urls.versions + version.id + '/'}
                      >
                        <FormattedMessage {...messages.replace} />
                      </FileUploaderButton>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {isLastVersion(index) && !referralIsPublished(referral) && (
                    <>
                      {isAuthor(currentUser, version) && referral.validation_state === 1 && (
                        <>
                          <IconTextButton
                            otherClasses={`btn-warning ${
                              isValidating(version)
                                ? 'cursor-not-allowed italic'
                                : ''
                            }`}
                            icon={<ValidationIcon color={IconColor.BLACK} />}
                            onClick={() => {
                              !isValidating(version) &&
                                setValidationModalOpen(true);
                            }}
                          >
                            {isValidating(version) ? (
                              <FormattedMessage
                                {...messages.validationRequested}
                              />
                            ) : (
                              <FormattedMessage
                                {...messages.requestValidation}
                              />
                            )}
                          </IconTextButton>
                          <ValidationModal
                            setValidationModalOpen={setValidationModalOpen}
                            isValidationModalOpen={isValidationModalOpen}
                          />
                        </>
                      )}
                      {isGranted(currentUser, referral) && referral.validation_state === 1 && (
                        <>
                          <ValidationSelect
                            options={[
                              {
                                id: 'validate',
                                value: 'Valider la version',
                                onClick: () => {
                                  setValidateModalOpen(true);
                                  setValidateModalOpen(true);
                                },
                                css: 'text-success-600 hover:bg-success-200',
                              },
                              {
                                id: 'request_change',
                                value: 'Demander revision',
                                onClick: () => {
                                  setRequestChangeModalOpen(true);
                                  setRequestChangeModalOpen(true);
                                },
                                css: 'text-danger-600 hover:bg-danger-200',
                              },
                            ]}
                          />
                          <ValidateModal
                            versionNumber={versionNumber}
                            setModalOpen={setValidateModalOpen}
                            isModalOpen={isValidateModalOpen}
                          />
                          <RequestChangeModal
                            versionNumber={versionNumber}
                            setModalOpen={setRequestChangeModalOpen}
                            isModalOpen={isRequestChangeModalOpen}
                          />
                        </>
                      )}
                    </>
                  )}
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
      )}
    </>
  );
};
