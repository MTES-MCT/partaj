import React, { useContext, useEffect, useState } from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  useIntl,
} from 'react-intl';
import {
  ErrorCodes,
  ReferralReport,
  ReferralReportVersion,
  ReportEvent,
  ReportEventVerb,
  User,
} from '../../types';
import { urls } from '../../const';
import { useCurrentUser } from '../../data/useCurrentUser';
import { isAuthor } from '../../utils/version';
import { SendVersionModal } from './SendVersionModal';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { referralIsPublished } from '../../utils/referral';
import { EditFileIcon, SendIcon } from '../Icons';
import { VersionUpdateButton } from '../FileUploader/VersionUpdateButton';
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
import { Nullable } from '../../types/utils';
import { SelectOption } from '../select/BaseSelect';
import { WarningModal } from '../modals/WarningModal';
import { ErrorModal } from '../modals/ErrorModal';
import { commonMessages } from '../../const/translations';

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
  requestChange: {
    defaultMessage: 'Request change',
    description: 'Request change button text',
    id: 'components.Version.requestChange',
  },
  validateVersion: {
    defaultMessage: 'Validate version',
    description: 'Validate version text',
    id: 'components.Version.validateVersion',
  },
  requestChangeDescription: {
    defaultMessage:
      'Request a change from the author of the version, who will be notified of your request by email.',
    description: 'Request change button text',
    id: 'components.Version.requestChangeDescription',
  },
  requestValidationDescription: {
    defaultMessage:
      'Request validation from your hierarchy with comments and notify by email the persons concerned by this request',
    description: 'Request change button text',
    id: 'components.Version.requestValidationDescription',
  },
  validateVersionDescription: {
    defaultMessage:
      'Validates the version and notifies all persons assigned to this referral',
    description: 'Validate description',
    id: 'components.Version.validateDescription',
  },
  validationRequested: {
    defaultMessage: 'Validation requested',
    description: 'Validation requested button text',
    id: 'components.Version.validationRequested',
  },
  updateButtonDisabledText: {
    defaultMessage:
      'File replacement is not allowed when a revision is requested, please publish a new version',
    description: 'Update button disabled text',
    id: 'components.Version.updateButtonDisabledText',
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
  const intl = useIntl();
  const [options, setOptions] = useState<Array<SelectOption>>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isWarningModalOpen, setWarningModalOpen] = useState(false);
  const [isValidationModalOpen, setValidationModalOpen] = useState(false);
  const [isValidateModalOpen, setValidateModalOpen] = useState(false);
  const [isErrorModalOpen, setErrorModalOpen] = useState(false);
  const [isRequestChangeModalOpen, setRequestChangeModalOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState(0);
  const versionNumber = version?.version_number ?? versionsLength - index;

  const isLastVersion = (index: number) => {
    /** Check if index equal zero as last version is first returned by API (ordering=-created_at)**/
    return index === 0;
  };

  const hasValidated = (
    currentUser: Nullable<User>,
    version: Nullable<ReferralReportVersion>,
  ) => {
    if (!currentUser || !version) {
      return false;
    }

    return (
      version.events.filter(
        (event: ReportEvent) =>
          event.verb === ReportEventVerb.VERSION_VALIDATED &&
          event.user.id === currentUser.id,
      ).length > 0
    );
  };

  const hasRequestedChange = (
    currentUser: Nullable<User>,
    version: Nullable<ReferralReportVersion>,
  ) => {
    if (!currentUser || !version) {
      return false;
    }

    return (
      version.events.filter(
        (event: ReportEvent) =>
          event.verb === ReportEventVerb.REQUEST_CHANGE &&
          event.user.id === currentUser.id,
      ).length > 0
    );
  };

  const isChangeRequested = (version: Nullable<ReferralReportVersion>) => {
    if (!version) {
      return false;
    }

    return (
      version.events.filter(
        (event: ReportEvent) => event.verb === ReportEventVerb.REQUEST_CHANGE,
      ).length > 0
    );
  };

  const hasRequestedValidation = (
    currentUser: Nullable<User>,
    version: Nullable<ReferralReportVersion>,
  ) => {
    if (!currentUser || !version) {
      return false;
    }

    return (
      version.events.filter(
        (event: ReportEvent) =>
          event.verb === ReportEventVerb.REQUEST_VALIDATION &&
          event.user.id === currentUser.id,
      ).length > 0
    );
  };

  useEffect(() => {
    setOptions([
      {
        id: 'request_validation',
        value: intl.formatMessage(messages.requestValidation),
        description: intl.formatMessage(messages.requestValidationDescription),
        display: isAuthor(currentUser, version),
        active: {
          isActive: hasRequestedValidation(currentUser, version),
          text: 'demande envoyée',
          css: 'text-warning-600 italic text-sm',
        },
        onClick: () => {
          setValidationModalOpen(true);
        },
        css: 'text-black hover:bg-warning-100',
      },
      {
        id: 'validate',
        value: intl.formatMessage(messages.validateVersion),
        description: intl.formatMessage(messages.validateVersionDescription),
        display: isGranted(currentUser, referral),
        active: {
          isActive: hasValidated(currentUser, version),
          text: 'validée',
          css: 'text-success-600 italic text-sm',
        },
        onClick: () => {
          setValidateModalOpen(true);
        },
        css: 'text-black hover:bg-success-100',
      },
      {
        id: 'request_change',
        value: intl.formatMessage(messages.requestChange),
        description: intl.formatMessage(messages.requestChangeDescription),
        display: isGranted(currentUser, referral),
        onClick: () => {
          setRequestChangeModalOpen(true);
        },
        active: {
          isActive: hasRequestedChange(currentUser, version),
          text: 'demande envoyée',
          css: 'text-caution-500 italic text-sm',
        },
        css: 'text-black hover:bg-caution-100',
      },
    ]);
  }, [currentUser, version]);

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
                      <VersionUpdateButton
                        disabled={isChangeRequested(version)}
                        disabledText={intl.formatMessage(
                          messages.updateButtonDisabledText,
                        )}
                        icon={
                          <EditFileIcon
                            className={
                              isChangeRequested(version)
                                ? 'fill-grey400'
                                : 'fill-black'
                            }
                          />
                        }
                        cssClass="btn-gray"
                        onSuccess={(result) => {
                          setVersion(result);
                        }}
                        onError={(error) => {
                          if (error.code === ErrorCodes.FILE_FORMAT_FORBIDDEN) {
                            setErrorModalOpen(true);
                          }
                          Sentry.captureException(error.errors[0]);
                        }}
                        action={'PUT'}
                        url={urls.versions + version.id + '/'}
                      >
                        <FormattedMessage {...messages.replace} />
                      </VersionUpdateButton>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {isLastVersion(index) &&
                    !referralIsPublished(referral) &&
                    referral.validation_state === 1 && (
                      <>
                        <ValidationSelect options={options} />
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
                        <ValidationModal
                          setValidationModalOpen={setValidationModalOpen}
                          isValidationModalOpen={isValidationModalOpen}
                        />
                      </>
                    )}
                  <IconTextButton
                    testId="send-report-button"
                    otherClasses="btn-primary"
                    icon={<SendIcon className="fill-white" />}
                    onClick={() => {
                      if (isChangeRequested(version)) {
                        return setWarningModalOpen(true);
                      }
                      setModalOpen(true);
                      setActiveVersion(versionsLength - index);
                    }}
                  >
                    <FormattedMessage {...messages.send} />
                  </IconTextButton>
                  <WarningModal
                    isModalOpen={isWarningModalOpen}
                    onCancel={() => setWarningModalOpen(false)}
                    onContinue={() => {
                      setWarningModalOpen(false);
                      setModalOpen(true);
                    }}
                  />
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
          <ErrorModal
            isModalOpen={isErrorModalOpen}
            onConfirm={() => setErrorModalOpen(false)}
            textContent={intl.formatMessage(commonMessages.errorFileFormatText)}
          />
        </>
      )}
    </>
  );
};
