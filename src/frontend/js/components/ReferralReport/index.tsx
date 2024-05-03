import React, { useContext, useState } from 'react';

import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import {
  ReferralReportVersion,
  ReferralReport as RReport,
  ErrorCodes,
  ErrorResponse,
} from 'types';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { useReferralReport } from '../../data';
import { Version } from './Version';
import { urls } from '../../const';
import * as Sentry from '@sentry/react';
import { referralIsClosed, referralIsPublished } from '../../utils/referral';
import { AddIcon, DraftIcon } from '../Icons';
import { IconTextButton } from '../buttons/IconTextButton';
import { VersionProvider } from '../../data/providers/VersionProvider';
import { DropzoneFileUploader } from '../FileUploader/DropzoneFileUploader';
import { commonMessages } from '../../const/translations';
import { ErrorModalContext } from '../../data/providers/ErrorModalProvider';
import { getErrorMessage } from '../../utils/errors';

const messages = defineMessages({
  loadingReport: {
    defaultMessage: 'Loading referral report...',
    description:
      'Accessibility message for the spinner in the referral detail report tab.',
    id: 'components.ReferralReport.loadingReport',
  },
  dropVersion: {
    defaultMessage:
      'Drag and drop the version file here, or click to select it.\nOnce imported, only your unit will have access to this version',
    description:
      'Helper text in the file dropzone input in the attachments form field.',
    id: 'components.ReferralReport.dropVersion',
  },
  addVersion: {
    defaultMessage: 'Publish a new version',
    description: 'Add version CTA text',
    id: 'components.ReferralReport.addVersion',
  },
  emptyList: {
    defaultMessage: 'There is no version for this referral yet.',
    description:
      'Message for the empty state of the referral report without version yet.',
    id: 'components.ReferralReport.emptyList',
  },
  thDocument: {
    defaultMessage: 'Note',
    description:
      'Title for the column with document name in the referral report.',
    id: 'components.ReferralReport.thDocument',
  },
  thAuthor: {
    defaultMessage: 'Author',
    description: 'Title for the table column with referral answer authors.',
    id: 'components.ReferralReport.thAuthor',
  },
  thDate: {
    defaultMessage: 'Date',
    description: 'Title for the table column with referral answer dates.',
    id: 'components.ReferralReport.thDate',
  },
  thVersion: {
    defaultMessage: 'Version',
    description: 'Version number.',
    id: 'components.ReferralReport.thVersion',
  },
});

export const ReferralReport: React.FC = () => {
  const { referral, refetch } = useContext(ReferralContext);
  const { openErrorModal, setErrorMessage } = useContext(ErrorModalContext);
  const intl = useIntl();
  const [isAddingVersion, setAddingVersion] = useState(false);

  const [versionsAreLoaded, setVersionsAreLoaded] = useState(false);
  const [reportVersions, setReportVersions] = useState<ReferralReportVersion[]>(
    [],
  );
  const [report, setReport] = useState<RReport>();

  const { status: reportStatus } = useReferralReport(referral!.report!.id, {
    onSuccess: (data) => {
      setReport(data);
      setReportVersions(data.versions ? data.versions : []);
      setVersionsAreLoaded(true);
    },
  });

  const onError = (error: ErrorResponse) => {
    setErrorMessage(getErrorMessage(error.code, intl));
    openErrorModal();
    Sentry.captureException(error.errors[0]);
  };

  const onSuccess = (newVersion: ReferralReportVersion) => {
    setReportVersions((prevState) => [newVersion, ...prevState]);
    setAddingVersion(false);
    refetch();
  };

  if ([reportStatus].includes('error')) {
    return <GenericErrorMessage />;
  }

  if ([reportStatus].includes('idle') || [reportStatus].includes('loading')) {
    return (
      <Spinner size="large">
        <FormattedMessage {...messages.loadingReport} />
      </Spinner>
    );
  }

  return (
    <>
      <div
        data-testid="referral-report"
        className="rounded overflow-hidden inline-block max-w-full "
      >
        <div className="flex p-2 items-center justify-center bg-gray-200">
          <div className="mr-2">
            <DraftIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base"> Versions de réponse</h2>
        </div>
        <div className="bg-gray-100 p-6 space-y-6 min-h-210 flex flex-col items-center justify-center">
          {versionsAreLoaded && (
            <>
              {!referralIsPublished(referral) &&
                !referralIsClosed(referral) &&
                reportVersions.length > 0 && (
                  <>
                    {isAddingVersion ? (
                      <DropzoneFileUploader
                        onSuccess={(result) => onSuccess(result)}
                        onError={(error) => onError(error)}
                        withButton
                        action={'POST'}
                        url={urls.versions}
                        keyValues={[
                          ['report', referral!.report!.id],
                          [
                            'version_number',
                            (reportVersions.length + 1).toString(),
                          ],
                        ]}
                        message={messages.dropVersion}
                      />
                    ) : (
                      <div
                        key={'add-version'}
                        className="flex w-full items-left"
                      >
                        <IconTextButton
                          onClick={() => setAddingVersion(true)}
                          testId="add-version-button"
                          otherClasses="border border-primary-500 text-primary-500"
                          icon={<AddIcon className="fill-primary500" />}
                          text={intl.formatMessage(messages.addVersion)}
                        />
                      </div>
                    )}
                  </>
                )}

              <>
                {reportVersions.length > 0 ? (
                  <>
                    {reportVersions.map(
                      (version: ReferralReportVersion, index: number) => (
                        <VersionProvider
                          key={version.id}
                          initialVersion={version}
                        >
                          <Version
                            index={index}
                            report={report}
                            versionsLength={reportVersions.length}
                          />
                        </VersionProvider>
                      ),
                    )}
                  </>
                ) : (
                  <>
                    {isAddingVersion ? (
                      <DropzoneFileUploader
                        onSuccess={(result) => onSuccess(result)}
                        onError={(error) => onError(error)}
                        withButton
                        action={'POST'}
                        url={urls.versions}
                        keyValues={[
                          ['report', referral!.report!.id],
                          [
                            'version_number',
                            (reportVersions.length + 1).toString(),
                          ],
                        ]}
                        message={messages.dropVersion}
                      />
                    ) : (
                      <div className="flex items-center flex-col">
                        <div className="pl-8 pb-8 text-center">
                          <FormattedMessage {...messages.emptyList} />
                        </div>
                        <IconTextButton
                          onClick={() => setAddingVersion(true)}
                          testId="add-version-button"
                          otherClasses="border border-primary-500 text-primary-500"
                          icon={<AddIcon className="fill-primary500" />}
                          text={intl.formatMessage(messages.addVersion)}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            </>
          )}
        </div>
      </div>
    </>
  );
};
