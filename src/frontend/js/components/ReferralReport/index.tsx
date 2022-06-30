import React, { useContext, useState } from 'react';

import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { ReferralReportVersion } from 'types';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { useReferralReport } from '../../data';
import { DropzoneFileUploader } from '../DropzoneFileUploader';

const messages = defineMessages({
  loadingReport: {
    defaultMessage: 'Loading referral report...',
    description:
      'Accessibility message for the spinner in the referral detail report tab.',
    id: 'components.ReferralReport.loadingReport',
  },

  emptyList: {
    defaultMessage: 'There is no draft answer for this referral yet.',
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
  const [displayDropzone, setDisplayDropzone] = useState(false);

  const { data: reportData, status: reportStatus } = useReferralReport(
    referral!.report!.id,
    {
      onSuccess: (data) => {
        setReportVersions(data.versions ? data.versions : []);
      },
    },
  );
  const [reportVersions, setReportVersions] = useState<ReferralReportVersion[]>(
    [],
  );

  const onSuccess = (newVersion: ReferralReportVersion) => {
    setReportVersions((prevState) => [...prevState, newVersion]);
    refetch();
  };

  const onError = (error: any) => {
    console.log(error);
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
          </tr>
        </thead>
        <tbody className="answers-list-table">
          {reportVersions.length > 0 ? (
            <>
              {reportVersions.map(
                (version: ReferralReportVersion, index: number) => (
                  <tr
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
                        {version.created_by.first_name}{' '}
                        {version.created_by.last_name}
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
                  </tr>
                ),
              )}
              {displayDropzone ? (
                <tr
                  key={'dropzone-area'}
                  className={`stretched-link-container relative`}
                >
                  <td colSpan={4}>
                    <DropzoneFileUploader
                      onSuccess={(result) => onSuccess(result)}
                      onError={(error) => onError(error)}
                    />
                  </td>
                </tr>
              ) : (
                <tr
                  key={'add-version'}
                  className={`stretched-link-container relative`}
                >
                  <td colSpan={4}>
                    <button onClick={() => setDisplayDropzone(true)}>
                      {' '}
                      + Ajouter une version{' '}
                    </button>
                  </td>
                </tr>
              )}
            </>
          ) : (
            <tr
              key={'dropzone-area'}
              className={`stretched-link-container relative`}
            >
              <td colSpan={4}>
                <DropzoneFileUploader
                  onSuccess={(result) => onSuccess(result)}
                  onError={(error) => onError(error)}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
