import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { TextFieldMachine, UpdateEvent } from './machines';

const messages = defineMessages({
  description: {
    defaultMessage: 'Why is this referral urgent?',
    description:
      'Description for the urgency explanation field in the referral form',
    id: 'components.ReferralForm.UrgencyExplanationField.description',
  },
  label: {
    defaultMessage: 'Urgency explanation',
    description: 'Label for the urgency explanation field in the referral form',
    id: 'components.ReferralForm.UrgencyExplanationField.label',
  },
});

interface UrgencyExplanationFieldProps {
  sendToParent: Sender<UpdateEvent>;
}

export const UrgencyExplanationField: React.FC<UrgencyExplanationFieldProps> = ({
  sendToParent,
}) => {
  const seed = useUIDSeed();

  const [state, send] = useMachine(TextFieldMachine, {
    actions: {
      setValue: assign({
        value: (_, event) => event.data,
      }),
    },
    guards: {
      isValid: () => true,
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
      fieldName: 'urgency_explanation',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  return (
    <div className="mb-8">
      <label
        htmlFor={seed('referral-urgency-explanation-label')}
        className="mb-1 font-semibold"
      >
        <FormattedMessage {...messages.label} />
      </label>
      <p
        id={seed('referral-urgency-explanation-description')}
        className="text-gray-600 mt-0 mb-1"
      >
        <FormattedMessage {...messages.description} />
      </p>
      <textarea
        className="form-control"
        cols={40}
        rows={4}
        id={seed('referral-urgency-explanation-label')}
        name="urgency-explanation"
        value={state?.context!.value}
        aria-describedby={seed('referral-urgency-explanation-description')}
        onChange={(e) => send({ type: 'CHANGE', data: e.target.value })}
      />
    </div>
  );
};
