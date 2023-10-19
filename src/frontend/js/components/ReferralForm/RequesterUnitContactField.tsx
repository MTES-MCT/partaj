import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { assign, Sender } from 'xstate';

import { TextFieldMachine, UpdateEvent } from './machines';
import { CleanAllFieldsProps } from '.';
import { DescriptionText } from '../styled/text/DescriptionText';
import { isValidEmail } from 'utils/string';

const messages = defineMessages({
  emailInputDescription: {
    defaultMessage:
      'Please provide the email of your contact in your business unit',
    description:
      'Description for the email input field for a decentralised contact',
    id:
      'components.ReferralForm.RequesterUnitContactField.emailInputDescription',
  },
  emailInputPlaceholder: {
    defaultMessage: 'Enter your contact email',
    description:
      'Placeholder text for the email input field for a decentralised unit contact',
    id:
      'components.ReferralForm.RequesterUnitContactField.emailInputPlaceholder',
  },
  invalid: {
    defaultMessage: 'The email of your contact in the business unit is invalid',
    description:
      'Error message showed when the service type is decentralised and the email has an invalid value in the referral form',
    id: 'components.ReferralForm.RequesterUnitContactField.invalid',
  },
});

interface RequesterUnitContactFieldProps extends CleanAllFieldsProps {
  sendToParent: Sender<UpdateEvent<string>>;
  requesterUnitContact?: string;
}

export const RequesterUnitContactField: React.FC<RequesterUnitContactFieldProps> = ({
  cleanAllFields,
  sendToParent,
  requesterUnitContact,
}) => {
  const intl = useIntl();

  const [state, send] = useMachine(TextFieldMachine, {
    context: {
      value: requesterUnitContact,
    },
    actions: {
      setValue: assign({
        value: (_, event) => event.data,
      }),
    },
    guards: {
      isValid: (context) =>
        context.value.length > 0 && isValidEmail(context.value),
    },
  });

  useEffect(() => {
    if (cleanAllFields) {
      send('CLEAN');
    }
  }, [cleanAllFields]);

  // Send an update to the parent whenever the state or context changes
  useEffect(() => {
    sendToParent({
      payload: {
        clean: state.matches('cleaned.true'),
        data: state.context.value,
        valid: state.matches('validation.valid'),
      },
      fieldName: 'requester_unit_contact',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  return (
    <div className="mt-4">
      <DescriptionText>
        <FormattedMessage {...messages.emailInputDescription} />
      </DescriptionText>
      <input
        className={`form-control`}
        type="text"
        title={intl.formatMessage(messages.emailInputPlaceholder)}
        placeholder={intl.formatMessage(messages.emailInputPlaceholder)}
        onChange={(e) => {
          e.preventDefault();
          send({
            type: 'CHANGE',
            data: e.target.value,
          });
        }}
      />
      {state.matches('cleaned.true') && state.matches('validation.invalid') ? (
        <div className="mt-4 text-danger-600">
          <FormattedMessage {...messages.invalid} />
        </div>
      ) : null}
    </div>
  );
};
