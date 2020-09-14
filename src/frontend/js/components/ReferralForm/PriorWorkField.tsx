import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { RichTextFieldMachine, UpdateEvent } from './machines';
import { RichTextField } from 'components/RichText/field';
import { CleanAllFieldsProps } from '.';

const messages = defineMessages({
  description: {
    defaultMessage:
      'How do you interpret the referral question? ' +
      'Have you already formalized your own analysis on the topic? ' +
      'What is your position on this question?',
    description: 'Description for the prior work field in the referral form',
    id: 'components.ReferralForm.PriorWorkField.description',
  },
  invalid: {
    defaultMessage:
      'Providing some prior work is mandatory to submit a referral.',
    description:
      'Error message showed when prior work field has an invalid value in the referral form',
    id: 'components.ReferralForm.PriorWorkField.invalid',
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

export const PriorWorkField: React.FC<
  PriorWorkFieldProps & CleanAllFieldsProps
> = ({ cleanAllFields, sendToParent }) => {
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
        data: JSON.stringify(state.context.value.serializableState),
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

      <RichTextField onChange={(e) => send({ type: 'CHANGE', data: e.data })} />
      {state.matches('cleaned.true') && state.matches('validation.invalid') ? (
        <div className="mt-4 text-red-500">
          <FormattedMessage {...messages.invalid} />
        </div>
      ) : null}
    </div>
  );
};
