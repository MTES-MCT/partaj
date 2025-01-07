import React, { useContext } from 'react';
import { ReferralFormContext } from '../../../data/providers/ReferralFormProvider';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { kebabCase } from 'lodash-es';
import { GenericModalContext } from '../../../data/providers/GenericModalProvider';
import { useSendReferralAction } from '../../../data/referral';
import { Referral } from '../../../types';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import * as Sentry from '@sentry/react';
import { Spinner } from '../../Spinner';
import { appData } from 'appData';

const messages = defineMessages({
  errorTitle: {
    defaultMessage: 'The form is incomplete',
    description: 'Form error modal title',
    id: 'components.SubmitFormButton.errorTitle',
  },
  genericErrorTitle: {
    defaultMessage: 'An error occured during form validation',
    description: 'Generic error modal title',
    id: 'components.SubmitFormButton.genericErrorTitle',
  },
  genericErrorContent: {
    defaultMessage:
      'The form seems to be incorrectly filled, please refresh and try again. If the issue persists, please contact us at {mail}.',
    description: 'Generic error modal title',
    id: 'components.SubmitFormButton.genericErrorContent',
  },
  errorMessageHead: {
    defaultMessage: 'The form is incomplete in the following areas:',
    description: 'Form error modal head message',
    id: 'components.SubmitFormButton.errorMessageHead',
  },
  errorMessageFoot: {
    defaultMessage: 'Please correct any errors indicated in red in the form.',
    description: 'Form error modal foot message',
    id: 'components.SubmitFormButton.errorMessageFoot',
  },
});

export const SubmitFormButton: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const { validate } = useContext(ReferralFormContext);
  const { openGenericModal } = useContext(GenericModalContext);
  const sendReferralMutation = useSendReferralAction({
    onError: (error) => {
      openGenericModal({
        title: <span>{intl.formatMessage(messages.genericErrorTitle)}</span>,
        content: (
          <span>
            {intl.formatMessage(messages.genericErrorContent, {
              mail: appData.contact_email,
            })}
          </span>
        ),
      });
      Sentry.captureException(error);
    },
    onSuccess: (referral: Referral) => {
      window.location.assign(`/app/sent-referral/${referral.id}/`);
    },
  });
  const { referral } = useContext(ReferralContext);
  const intl = useIntl();

  return (
    <button
      type="submit"
      disabled={sendReferralMutation.isLoading}
      className={`btn btn-primary flex justify-center items-center space-x-2`}
      style={{ minWidth: '12rem', minHeight: '2.5rem' }}
      onClick={() => {
        const errors = validate();

        if (Object.keys(errors).length > 0) {
          return openGenericModal({
            title: <span>{intl.formatMessage(messages.errorTitle)}</span>,
            content: (
              <div className="flex flex-col">
                <p>
                  <FormattedMessage {...messages.errorMessageHead} />
                </p>
                <br />
                <ul>
                  {Object.values(errors)
                    .filter(
                      (value, index, array) => array.indexOf(value) === index,
                    )
                    .map((value) => (
                      <li
                        key={`section-error-${kebabCase(value as string)}`}
                        className="font-medium"
                      >
                        {value as string}
                      </li>
                    ))}
                </ul>
                <br />
                <p>
                  <FormattedMessage {...messages.errorMessageFoot} />
                </p>
              </div>
            ),
          });
        }

        referral && sendReferralMutation.mutate(referral);
      }}
    >
      {sendReferralMutation.isLoading ? <Spinner size="small" /> : children}
    </button>
  );
};
