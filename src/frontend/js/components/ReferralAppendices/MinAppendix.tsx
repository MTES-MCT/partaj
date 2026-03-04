import React, { useContext } from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { ReferralReport, ReferralState } from '../../types';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { AppendixEventIndicator } from './AppendixEventIndicator';
import { ScanVerified } from '../Attachment/ScanVerified';
import { AppendixDocument } from './AppendixDocument';
import { AppendixContext } from '../../data/providers/AppendixProvider';

interface AppendixProps {
  report: ReferralReport | undefined;
  index: number;
  appendicesLength: number;
}

const messages = defineMessages({
  publicationDate: {
    defaultMessage: 'Publication date { date }',
    description: 'Title for the version publication date.',
    id: 'components.Appendix.publicationDate',
  },
  send: {
    defaultMessage: 'Send to requester(s)',
    description: 'Title for the appendix send button.',
    id: 'components.Appendix.send',
  },
  replace: {
    defaultMessage: 'Replace',
    description: 'Title for the appendix replace button.',
    id: 'components.Appendix.replace',
  },
  requestValidation: {
    defaultMessage: 'Request validation',
    description: 'Request validation button text',
    id: 'components.Appendix.requestValidation',
  },
  requestChange: {
    defaultMessage: 'Request change',
    description: 'Request change button text',
    id: 'components.Appendix.requestChange',
  },
  validateAppendix: {
    defaultMessage: 'Validate appendix',
    description: 'Validate appendix text',
    id: 'components.Appendix.validateAppendix',
  },
  requestChangeDescription: {
    defaultMessage:
      'Request a change from the author of the appendix, who will be notified of your request by email.',
    description: 'Request change button text',
    id: 'components.Appendix.requestChangeDescription',
  },
  requestValidationDescription: {
    defaultMessage:
      'Request validation from your hierarchy with comments and notify by email the persons concerned by this request',
    description: 'Request change button text',
    id: 'components.Appendix.requestValidationDescription',
  },
  validateAppendixDescription: {
    defaultMessage:
      'Validates the appendix and notifies all persons assigned to this referral',
    description: 'Validate description',
    id: 'components.Appendix.validateAppendixDescription',
  },
  validationRequested: {
    defaultMessage: 'Validation requested',
    description: 'Validation requested button text',
    id: 'components.Appendix.validationRequested',
  },
  updateButtonDisabledText: {
    defaultMessage:
      'File replacement is not allowed when a revision is requested, please publish a new appendix',
    description: 'Update button disabled text',
    id: 'components.Appendix.updateButtonDisabledText',
  },
});

export const MinAppendix: React.FC<AppendixProps> = ({
  index,
  appendicesLength,
}) => {
  const { referral } = useContext(ReferralContext);
  const { appendix } = useContext(AppendixContext);
  const appendixNumber = appendix?.appendix_number ?? appendicesLength - index;

  return (
    <>
      {referral && appendix && (
        <div
          data-testid="appendix"
          key={appendix.id}
          className={`flex w-full flex-col relative bg-white border border-black`}
        >
          <div className={`flex w-full flex-col space-y-4`}>
            <div className="space-y-1">
              <div className="w-full border-b border-black font-medium flex items-center px-3 py-2 justify-between">
                <p>Annexe {appendixNumber}</p>
                <div className={`flex justify-between text-grey-700 text-sm`}>
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
                </div>
              </div>
              <div className="px-3">
                {appendix.events.length > 0 && referral.validation_state === 1 && (
                  <div
                    className="space-y-1"
                    style={{ marginTop: '16px', marginBottom: '16px' }}
                  >
                    {appendix.events.map((event: any) => (
                      <AppendixEventIndicator key={event.id} event={event} />
                    ))}
                  </div>
                )}
                <div className="w-full relative mb-5">
                  <AppendixDocument appendix={appendix} />
                  <div
                    className={`${
                      referral.state != ReferralState.ANSWERED && 'absolute'
                    } top-8`}
                  >
                    <ScanVerified file={appendix.document} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
