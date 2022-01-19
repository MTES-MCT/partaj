import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { User } from 'types';
import { getUserFullname } from 'utils/user';
import { TextFieldMachine, UpdateEvent } from './machines';
import { CleanAllFieldsProps } from '.';

const messages = defineMessages({
  description: {
    defaultMessage:
      'Identity of the person and service requesting the referral. ' +
      'It can be different from the authenticated user name if you want the referral to be formally addressed to someone else.',
    description:
      'Description for the requester name field in the referral form',
    id: 'components.ReferralForm.RequesterField.description',
  },
  label: {
    defaultMessage: 'Requester name',
    description: 'Label for the requester name field in the referral form',
    id: 'components.ReferralForm.RequesterField.label',
  },
});

interface RequesterFieldProps extends CleanAllFieldsProps {
  sendToParent: Sender<UpdateEvent>;
  user: User;
  users: User[];
}

export const RequesterField: React.FC<RequesterFieldProps> = ({
  cleanAllFields,
  sendToParent,
  user,
  users,
}) => {
  const seed = useUIDSeed();

  const [state, send] = useMachine(TextFieldMachine, {
    context: {
      value: users.map((user) => getUserFullname(user)).join(', '),
    },
    actions: {
      setValue: assign({
        value: (_, event) => event.data,
      }),
    },
    guards: {
      isValid: (context) => !!context.value && context.value.length > 0,
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
      fieldName: 'requester',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  return (
    <div className="mb-8">
      <label
        htmlFor={seed('requester-name-label')}
        className="mb-1 font-semibold"
      >
        <FormattedMessage {...messages.label} />
      </label>
      <p
        id={seed('requester-name-description')}
        className="text-gray-500 mt-0 mb-1"
      >
        <FormattedMessage {...messages.description} />
      </p>
      <input
        type="text"
        className="form-control"
        maxLength={500}
        id={seed('requester-name-label')}
        name="requester"
        value={state?.context!.value}
        required={true}
        aria-describedby={seed('requester-name-description')}
        onChange={(e) => send({ type: 'CHANGE', data: e.target.value })}
      />
    </div>
  );
};
