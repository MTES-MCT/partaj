import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { TextFieldMachine, UpdateEvent } from './machines';

const messages = defineMessages({
  description: {
    defaultMessage:
      'How do you interpret the referral question? ' +
      'Have you already formalized your own analysis on the topic? ' +
      'What is your position on this question?',
    description: 'Description for the prior work field in the referral form',
    id: 'components.ReferralForm.PriorWorkField.description',
  },
  label: {
    defaultMessage: 'Prior work',
    description: 'Label for the prior work field in the referral form',
    id: 'components.ReferralForm.PriorWorkField.label',
  },
});

interface PriorWorkFieldProps {
  sendToParent: Sender<UpdateEvent>;
}

export const PriorWorkField: React.FC<PriorWorkFieldProps> = ({
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
      fieldName: 'prior_work',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  return (
    <div className="mb-8">
      <label
        htmlFor={seed('referral-prior-work-label')}
        className="mb-1 font-semibold"
      >
        <FormattedMessage {...messages.label} />
      </label>
      <p
        id={seed('referral-prior-work-description')}
        className="text-gray-600 mt-0 mb-1"
      >
        <FormattedMessage {...messages.description} />
      </p>
      <textarea
        className="form-control"
        cols={40}
        rows={10}
        id={seed('referral-prior-work-label')}
        name="{{ form.prior_work.html_name }}"
        value={state?.context!.value}
        required={true}
        aria-describedby={seed('referral-prior-work-description')}
        onChange={(e) => send({ type: 'CHANGE', data: e.target.value })}
      />
    </div>
  );
};
