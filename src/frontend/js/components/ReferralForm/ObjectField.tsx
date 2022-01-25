import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { TextFieldMachine, UpdateEvent } from './machines';
import { CleanAllFieldsProps } from '.';

const messages = defineMessages({
  description: {
    defaultMessage: 'Brief sentence describing the object of this referral',
    description: 'Description for the object field in the referral form',
    id: 'components.ReferralForm.ObjectField.description',
  },
  invalid: {
    defaultMessage: 'Providing an object is mandatory to submit a referral.',
    description:
      'Error message showed when object field has an invalid value in the referral form',
    id: 'components.ReferralForm.ObjectField.invalid',
  },
  label: {
    defaultMessage: 'Referral object',
    description: 'Label for the object field in the referral form',
    id: 'components.ReferralForm.ObjectField.label',
  },
});

interface ObjectFieldProps extends CleanAllFieldsProps {
  sendToParent: Sender<UpdateEvent>;
  objectValue?: string;
}

export const ObjectField: React.FC<ObjectFieldProps> = ({
  cleanAllFields,
  sendToParent,
  objectValue,
}) => {
  const seed = useUIDSeed();

  const [state, send] = useMachine(TextFieldMachine, {
    context: {
      value: objectValue || '',
    },
    actions: {
      setValue: assign({
        value: (_, event) => event.data,
      }),
    },
    guards: {
      isValid: (context) => context.value.length > 0,
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
      fieldName: 'object',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  return (
    <div className="mb-8">
      <label
        htmlFor={seed('referral-object-label')}
        className="mb-1 font-semibold"
      >
        <FormattedMessage {...messages.label} />
      </label>
      <p
        id={seed('referral-object-description')}
        className="text-gray-500 mt-0 mb-1"
      >
        <FormattedMessage {...messages.description} />
      </p>
      <textarea
        className="form-control"
        cols={40}
        rows={2}
        maxLength={60}
        id={seed('referral-object-label')}
        name="object"
        value={state?.context!.value}
        aria-describedby={seed('referral-object-description')}
        onChange={(e) => send({ type: 'CHANGE', data: e.target.value })}
      />
      {state.matches('cleaned.true') && state.matches('validation.invalid') ? (
        <div className="mt-4 text-danger-600">
          <FormattedMessage {...messages.invalid} />
        </div>
      ) : null}
    </div>
  );
};
