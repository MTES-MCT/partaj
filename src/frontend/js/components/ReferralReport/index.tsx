import React, { useContext, useState } from 'react';

import { defineMessages, FormattedMessage } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { ReferralReportVersion, ReferralReport as RReport } from 'types';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { useReferralReport } from '../../data';
import { DropzoneFileUploader } from '../DropzoneFileUploader';
import { Version } from './Version';
import { urls } from '../../const';
import { isAuthor } from '../../utils/version';
import { useCurrentUser } from '../../data/useCurrentUser';
import { getLastItem } from '../../utils/array';
import * as Sentry from '@sentry/react';

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

  const { data: reportData, status: reportStatus } = useReferralReport(
    referral!.report!.id,
    {
      onSuccess: (data) => {
        setReport(data);
        setReportVersions(data.versions ? data.versions : []);
        setVersionsAreLoaded(true);
      },
    },
  );

  const onUpdateSuccess = (version: ReferralReportVersion, index: number) => {
    setReportVersions((prevReportVersions) => {
      prevReportVersions[index] = version;
      return [...prevReportVersions];
    });
  };

  const onError = (error: any) => {
    Sentry.captureException(error);
  };

  const onSuccess = (newVersion: ReferralReportVersion) => {
    setReportVersions((prevState) => [...prevState, newVersion]);
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
    <div
      className="border-2 border-gray-200 rounded-sm inline-block max-w-full"
      style={{ width: '60rem' }}
    >
      <table className="min-w-full relative" style={{ zIndex: 1 }}>
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th scope="col" className="p-3">
              <FormattedMessage {...messages.thVersion} />
            </th>
            <th scope="col" className="p-3">
              <FormattedMessage {...messages.thDate} />
            </th>
            <th scope="col" className="p-3">
              <FormattedMessage {...messages.thAuthor} />
            </th>
            <th scope="col" className="p-3">
              <FormattedMessage {...messages.thDocument} />
            </th>
            <th scope="col" className="p-3">
              {''}
            </th>
          </tr>
        </thead>
        <tbody className="answers-list-table">
          {versionsAreLoaded && (
            <>
              {reportVersions.length > 0 ? (
                <>
                  {reportVersions.map(
                    (version: ReferralReportVersion, index: number) => (
                      <Version
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
                  {isAddingVersion ? (
                    <tr
                      key={'dropzone-area'}
                      className={`stretched-link-container relative`}
                    >
                      <td colSpan={5}>
                        <DropzoneFileUploader
                          onSuccess={(result) => onSuccess(result)}
                          onError={(error) => onError(error)}
                          action={'POST'}
                          url={urls.versions}
                          keyValues={['report', referral!.report!.id]}
                          message={messages.dropVersion}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={'add-version'}
                      className={`stretched-link-container relative`}
                    >
                      <td colSpan={5}>
                        {!isAuthor(
                          currentUser,
                          getLastItem(reportVersions),
                        ) && (
                          <button onClick={() => setAddingVersion(true)}>
                            {' '}
                            + Ajouter une version{' '}
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr
                  key={'dropzone-area'}
                  className={`stretched-link-container relative`}
                >
                  <td colSpan={5}>
                    <div className="flex flex-col pb-8 pt-8">
                      <div className="pl-8 pb-8 pb-8 text-center">
                        <FormattedMessage {...messages.emptyList} />
                      </div>
                      <DropzoneFileUploader
                        onSuccess={(result) => onSuccess(result)}
                        onError={(error) => onError(error)}
                        action={'POST'}
                        url={urls.versions}
                        keyValues={['report', referral!.report!.id]}
                        message={messages.dropVersion}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};
