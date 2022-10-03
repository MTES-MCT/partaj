import React, { useContext, useState } from 'react';

import { defineMessages, FormattedMessage } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { ReferralReportVersion, ReferralReport as RReport, User } from 'types';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { useReferralReport } from '../../data';
import { DropzoneFileUploader } from '../FileUploader';
import { Version } from './Version';
import { urls } from '../../const';
import { isAuthor } from '../../utils/version';
import { useCurrentUser } from '../../data/useCurrentUser';
import { getLastItem } from '../../utils/array';
import * as Sentry from '@sentry/react';
import { referralIsPublished } from '../../utils/referral';
import { AddIcon, DraftIcon, EditIcon } from '../Icons';
import { IconTextButton } from '../buttons/IconTextButton';
import { Nullable } from '../../types/utils';

const messages = defineMessages({
  loadingReport: {
    defaultMessage: 'Loading referral report...',
    description:
      'Accessibility message for the spinner in the referral detail report tab.',
    id: 'components.ReferralReport.loadingReport',
  },
  dropVersion: {
    defaultMessage:
      'Drag and drop the version file here, or click to select it',
    description:
      'Helper text in the file dropzone input in the attachments form field.',
    id: 'components.ReferralReport.dropVersion',
  },
  addVersion: {
    defaultMessage: '+ Add a version',
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
  const { currentUser } = useCurrentUser();
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

  const onUpdateSuccess = (version: ReferralReportVersion, index: number) => {
    setReportVersions((prevReportVersions) => {
      prevReportVersions[index] = version;
      return [...prevReportVersions];
    });
  };

  const onError = (error: any) => {
    Sentry.captureException(error);
  };

  const getLastVersion = (versions: ReferralReportVersion[]) => {
    /** return first item as versions are returned ordered by -created_at by API**/
    return versions[0];
  };

  const isLastVersionAuthor = (
    user: Nullable<User>,
    versions: ReferralReportVersion[],
  ) => {
    return isAuthor(user, getLastVersion(versions));
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
            <DraftIcon size={6} />
          </div>
          <h2 className="text-lg text-base"> Versions de réponse</h2>
        </div>
        <div className="bg-gray-100 p-6 space-y-6 min-h-210 flex flex-col items-center justify-center">
          {!referralIsPublished(referral) && reportVersions.length > 0 && (
            <>
              {isAddingVersion ? (
                <DropzoneFileUploader
                  onSuccess={(result) => onSuccess(result)}
                  onError={(error) => onError(error)}
                  action={'POST'}
                  url={urls.versions}
                  keyValues={['report', referral!.report!.id]}
                  message={messages.dropVersion}
                />
              ) : (
                <>
                  {!isLastVersionAuthor(currentUser, reportVersions) && (
                    <div
                      key={'add-version'}
                      className={`stretched-link-container relative`}
                    >
                      <div>
                        <IconTextButton
                          onClick={() => setAddingVersion(true)}
                          testId="add-version-button"
                          icon={<AddIcon />}
                        >
                          <FormattedMessage {...messages.addVersion} />
                        </IconTextButton>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {versionsAreLoaded && (
            <>
              {reportVersions.length > 0 ? (
                <>
                  {reportVersions.map(
                    (version: ReferralReportVersion, index: number) => (
                      <Version
                        key={version.id}
                        index={index}
                        report={report}
                        versionsLength={reportVersions.length}
                        version={version}
                        onUpdateSuccess={(result) =>
                          onUpdateSuccess(result, index)
                        }
                        onUpdateError={(error) => onError(error)}
                      />
                    ),
                  )}
                </>
              ) : (
                <>
                  {isAddingVersion ? (
                    <div
                      key={'dropzone-area'}
                      className={`stretched-link-container relative`}
                    >
                      <DropzoneFileUploader
                        onSuccess={(result) => onSuccess(result)}
                        onError={(error) => onError(error)}
                        action={'POST'}
                        url={urls.versions}
                        keyValues={['report', referral!.report!.id]}
                        message={messages.dropVersion}
                      />
                    </div>
                  ) : (
                    <>
                      {!isLastVersionAuthor(currentUser, reportVersions) && (
                        <div
                          key={'add-version'}
                          className={`stretched-link-container relative`}
                        >
                          <div className="flex items-center flex-col">
                            <div className="pl-8 pb-8 pb-8 text-center">
                              <FormattedMessage {...messages.emptyList} />
                            </div>
                            <IconTextButton
                              onClick={() => setAddingVersion(true)}
                              testId="add-version-button"
                              icon={<AddIcon />}
                            >
                              <FormattedMessage {...messages.addVersion} />
                            </IconTextButton>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
