import React, { useContext } from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { VersionDocument } from './VersionDocument';
import { VersionContext } from '../../data/providers/VersionProvider';

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

export const VersionSummary: React.FC<{ versionNumber: number }> = ({
  versionNumber,
}) => {
  const { version } = useContext(VersionContext);

  return (
    <>
      {version && (
        <>
          <div
            data-testid="version"
            key={version.id}
            className={`flex w-full flex-col relative`}
          >
            <div className={`flex justify-between text-lg font-medium`}>
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
            <VersionDocument version={version} readonly />
          </div>
        </>
      )}
    </>
  );
};
