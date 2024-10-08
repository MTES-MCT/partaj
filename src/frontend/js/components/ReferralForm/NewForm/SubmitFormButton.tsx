import React, { useContext } from 'react';
import { ReferralFormContext } from '../../../data/providers/ReferralFormProvider';
import { ErrorModalContext } from '../../../data/providers/ErrorModalProvider';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { kebabCase } from 'lodash-es';

const messages = defineMessages({
  errorTitle: {
    defaultMessage: 'The form is incomplete',
    description: 'Form error modal title',
    id: 'components.SubmitFormButton.errorTitle',
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

export const SubmitFormButton: React.FC<React.PropsWithChildren<{
  onClick: Function;
}>> = ({ children, onClick }) => {
  const intl = useIntl();
  const { validate } = useContext(ReferralFormContext);
  const { setErrorMessage, setErrorTitle, openErrorModal } = useContext(
    ErrorModalContext,
  );

  return (
    <button
      type="submit"
      className={`btn btn-primary flex justify-center`}
      style={{ minWidth: '12rem', minHeight: '2.5rem' }}
      onClick={() => {
        const errors = validate();
        if (Object.keys(errors).length > 0) {
          setErrorTitle(intl.formatMessage(messages.errorTitle));
          setErrorMessage(
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
                      {' '}
                      {value as string}
                    </li>
                  ))}
              </ul>
              <br />
              <p>
                <FormattedMessage {...messages.errorMessageFoot} />
              </p>
            </div>,
          );
          return openErrorModal();
        }

        onClick();
      }}
    >
      {children}
    </button>
  );
};
