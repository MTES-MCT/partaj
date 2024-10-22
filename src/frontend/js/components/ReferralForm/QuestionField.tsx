import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { RichTextFieldMachine, UpdateEvent } from './machines';
import { RichTextField } from 'components/RichText/field';
import { DescriptionText } from '../styled/text/DescriptionText';
import { CleanAllFieldsProps } from './OldReferralForm';

const messages = defineMessages({
  description: {
    defaultMessage: 'Question for which you are requesting the referral',
    description: 'Description for the question field in the referral form',
    id: 'components.ReferralForm.QuestionField.description',
  },
  invalid: {
    defaultMessage: 'Providing an object is mandatory to submit a referral.',
    description:
      'Error message showed when question field has an invalid value in the referral form',
    id: 'components.ReferralForm.QuestionField.invalid',
  },
  label: {
    defaultMessage: 'Referral question',
    description: 'Label for the question field in the referral form',
    id: 'components.ReferralForm.QuestionField.label',
  },
});

interface QuestionFieldProps extends CleanAllFieldsProps {
  sendToParent: Sender<UpdateEvent>;
  questionValue?: string;
}

export const QuestionField: React.FC<QuestionFieldProps> = ({
  cleanAllFields,
  sendToParent,
  questionValue,
}) => {
  const seed = useUIDSeed();
  const intl = useIntl();

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
      <DescriptionText>
        <FormattedMessage {...messages.description} />
      </DescriptionText>
      <RichTextField
        title={intl.formatMessage(messages.label)}
        initialContent={questionValue}
        onChange={(e) =>
          send({ type: e.cause === 'INIT' ? 'INIT' : 'CHANGE', data: e.data })
        }
      />
      {state.matches('cleaned.true') && state.matches('validation.invalid') ? (
        <div className="mt-4 text-danger-600">
          <FormattedMessage {...messages.invalid} />
        </div>
      ) : null}
    </div>
  );
};
