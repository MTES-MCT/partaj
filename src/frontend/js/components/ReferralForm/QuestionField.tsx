import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { TextFieldMachine, UpdateEvent } from './machines';

const messages = defineMessages({
  description: {
    defaultMessage: 'Question for which you are requesting the referral',
    description: 'Description for the question field in the referral form',
    id: 'components.ReferralForm.QuestionField.description',
  },
  label: {
    defaultMessage: 'Referral question',
    description: 'Label for the question field in the referral form',
    id: 'components.ReferralForm.QuestionField.label',
  },
});

interface QuestionFieldProps {
  sendToParent: Sender<UpdateEvent>;
}

export const QuestionField: React.FC<QuestionFieldProps> = ({
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
      fieldName: 'question',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  return (
    <div className="mb-8">
      <label
        htmlFor={seed('referral-question-label')}
        className="mb-1 font-semibold"
      >
        <FormattedMessage {...messages.label} />
      </label>
      <p
        id={seed('referral-question-description')}
        className="text-gray-600 mt-0 mb-1"
      >
        <FormattedMessage {...messages.description} />
      </p>
      <textarea
        className="form-control"
        cols={40}
        rows={5}
        id={seed('referral-question-label')}
        name="question"
        value={state?.context!.value}
        required={true}
        aria-describedby={seed('referral-question-description')}
        onChange={(e) => send({ type: 'CHANGE', data: e.target.value })}
      />
    </div>
  );
};
