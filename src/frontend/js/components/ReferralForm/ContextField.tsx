import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { TextFieldMachine, UpdateEvent } from './machines';

const messages = defineMessages({
  description: {
    defaultMessage:
      'Description of the facts characterizing it (on a political, technical, ' +
      'legal level) necessary to analyze and answer the question',
    description: 'Description for the context field in the referral form',
    id: 'components.ReferralForm.ContextField.description',
  },
  label: {
    defaultMessage: 'Context',
    description: 'Label for the context field in the referral form',
    id: 'components.ReferralForm.ContextField.label',
  },
});

interface ContextFieldProps {
  sendToParent: Sender<UpdateEvent>;
}

export const ContextField: React.FC<ContextFieldProps> = ({ sendToParent }) => {
  const seed = useUIDSeed();

  const [state, send] = useMachine(TextFieldMachine, {
    actions: {
      setValue: assign({
        value: (_, event) => event.data,
      }),
    },
    guards: {
      isValid: (context) => !!context.value && context.value.length > 0,
    },
  });

  // Send an update to the parent whenever the state or context changes
  useEffect(() => {
    sendToParent({
      payload: {
        clean: state.matches('cleaned.true'),
        data: state.context.value,
        valid: state.matches('validation.valid'),
      },
      fieldName: 'context',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  return (
    <div className="mb-8">
      <label
        htmlFor={seed('referral-context-label')}
        className="mb-1 font-semibold"
      >
        <FormattedMessage {...messages.label} />
      </label>
      <p
        id={seed('referral-context-description')}
        className="text-gray-600 mt-0 mb-1"
      >
        <FormattedMessage {...messages.description} />
      </p>
      <textarea
        className="form-control"
        cols={40}
        rows={10}
        id={seed('referral-context-label')}
        name="context"
        value={state?.context!.value}
        required={true}
        aria-describedby={seed('referral-context-description')}
        onChange={(e) => send({ type: 'CHANGE', data: e.target.value })}
      />
    </div>
  );
};
