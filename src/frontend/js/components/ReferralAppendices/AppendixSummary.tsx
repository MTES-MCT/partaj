import React from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { AppendixDocument } from './AppendixDocument';
import { ReferralReportAppendix } from '../../types';

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

export const AppendixSummary: React.FC<{
  appendix: ReferralReportAppendix;
}> = ({ appendix }) => {
  return (
    <>
      {appendix && (
        <>
          <div
            data-testid="version"
            key={appendix.id}
            className={`flex w-full flex-col relative`}
          >
            <div className={`flex justify-between text-lg font-medium`}>
              <span>Annexe {appendix.appendix_number}</span>
              <span>
                {appendix.created_by.first_name} {appendix.created_by.last_name}
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
                      value={appendix.updated_at}
                    />
                  ),
                }}
              />
              <div>
                <p>{appendix.created_by.unit_name}</p>
              </div>
            </div>
            <AppendixDocument appendix={appendix} readonly />
          </div>
        </>
      )}
    </>
  );
};
