import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { RichTextFieldMachine, UpdateEvent } from './machines';
import { RichTextField } from 'components/RichText/field';

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

  const [state, send] = useMachine(RichTextFieldMachine, {
    actions: {
      setValue: assign({
        value: (_, event) => event.data,
      }),
    },
    guards: {
      isValid: (context) =>
        !!context.value && context.value.textContent.length > 0,
    },
  });

  // Send an update to the parent whenever the state or context changes
  useEffect(() => {
    sendToParent({
      payload: {
        clean: state.matches('cleaned.true'),
        data: JSON.stringify(state.context.value.serializableState),
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

      <RichTextField onChange={(e) => send({ type: 'CHANGE', data: e.data })} />
    </div>
  );
};
