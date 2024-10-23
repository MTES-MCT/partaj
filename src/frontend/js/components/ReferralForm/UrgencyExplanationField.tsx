import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { TextFieldMachine, UpdateEvent } from './machines';

import { DescriptionText } from '../styled/text/DescriptionText';
import { CleanAllFieldsProps } from './OldReferralForm';

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
  urgencyNeedsExplanation: {
    defaultMessage: 'The urgency level you selected requires a justification.',
    description:
      'Error message when the user selects an urgency level that requires justification ' +
      'and forgot to justify it.',
    id:
      'components.ReferralForm.UrgencyExplanationField.urgencyNeedsExplanation',
  },
});

interface UrgencyExplanationFieldProps extends CleanAllFieldsProps {
  isRequired: boolean;
  sendToParent: Sender<UpdateEvent>;
  urgencyExplanationValue?: string;
}

export const UrgencyExplanationField: React.FC<UrgencyExplanationFieldProps> = ({
  cleanAllFields,
  isRequired,
  sendToParent,
  urgencyExplanationValue,
}) => {
  const seed = useUIDSeed();

  const [state, send] = useMachine(TextFieldMachine, {
    context: {
      value: urgencyExplanationValue || '',
    },
    actions: {
      setValue: assign({
        value: (_, event) => event.data,
      }),
    },
    guards: {
      isValid: () => true,
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
      <DescriptionText>
        <FormattedMessage {...messages.description} />
      </DescriptionText>
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
      {isRequired && state.context.value.length < 1 ? (
        <div className="mt-4 text-danger-600">
          <FormattedMessage {...messages.urgencyNeedsExplanation} />
        </div>
      ) : null}
    </div>
  );
};
