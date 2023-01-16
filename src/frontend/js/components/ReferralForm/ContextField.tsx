import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { RichTextFieldMachine, UpdateEvent } from './machines';
import { RichTextField } from 'components/RichText/field';
import { CleanAllFieldsProps } from '.';
import { DescriptionText } from '../styled/text/DescriptionText';

const messages = defineMessages({
  description: {
    defaultMessage:
      'Description of the facts characterizing it (on a political, technical, ' +
      'legal level) necessary to analyze and answer the question',
    description: 'Description for the context field in the referral form',
    id: 'components.ReferralForm.ContextField.description',
  },
  invalid: {
    defaultMessage: 'Providing context is mandatory to submit a referral.',
    description:
      'Error message showed when context field has an invalid value in the referral form',
    id: 'components.ReferralForm.ContextField.invalid',
  },
  label: {
    defaultMessage: 'Context',
    description: 'Label for the context field in the referral form',
    id: 'components.ReferralForm.ContextField.label',
  },
});

interface ContextFieldProps extends CleanAllFieldsProps {
  sendToParent: Sender<UpdateEvent>;
  contextValue?: string;
}

export const ContextField: React.FC<ContextFieldProps> = ({
  cleanAllFields,
  sendToParent,
  contextValue,
}) => {
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
      <DescriptionText>
        <FormattedMessage {...messages.description} />
      </DescriptionText>

      <RichTextField
        initialContent={contextValue}
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
