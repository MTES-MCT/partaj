import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReferralUrgencies } from 'data';
import { ReferralUrgency } from 'types';
import { UrgencyLevelFieldMachine, UpdateEvent } from './machines';
import { CleanAllFieldsProps } from '.';

const messages = defineMessages({
  description: {
    defaultMessage: 'Average response time is 3 weeks',
    description: 'Description for the urgency field in the referral form',
    id: 'components.ReferralForm.UrgencyField.description',
  },
  label: {
    defaultMessage: 'Expected response time',
    description: 'Label for the urgency field in the referral form',
    id: 'components.ReferralForm.UrgencyField.label',
  },
  loadingUrgencies: {
    defaultMessage: 'Loading urgency options...',
    description:
      'Accessible text for the spinner while loading urgency options in the referral form',
    id: 'components.ReferralForm.UrgencyField.loadingUrgencies',
  },
  threeWeeks: {
    defaultMessage: '3 weeks',
    description: 'Default value for the urgency field in the referral form',
    id: 'components.ReferralForm.UrgencyField.threeWeeks',
  },
});

interface UrgencyFieldProps extends CleanAllFieldsProps {
  urgencyLevel?: ReferralUrgency;
  sendToParent: Sender<UpdateEvent<ReferralUrgency>>;
}

export const UrgencyField = ({
  cleanAllFields,
  sendToParent,
  urgencyLevel,
}: UrgencyFieldProps) => {
  const { status, data } = useReferralUrgencies();

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingUrgencies} />
        </Spinner>
      );

    case 'success':
      return (
        <UrgencyFieldInner
          {...{
            cleanAllFields,
            sendToParent,
            urgencyLevel,
            urgencyLevels: data!.results,
          }}
        />
      );
  }
};

export const UrgencyFieldInner = ({
  cleanAllFields,
  sendToParent,
  urgencyLevel,
  urgencyLevels,
}: UrgencyFieldProps & { urgencyLevels: ReferralUrgency[] }) => {
  const seed = useUIDSeed();

  const [state, send] = useMachine(UrgencyLevelFieldMachine, {
    context: {
      value: urgencyLevel,
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
    const value =
      state.context.value ||
      urgencyLevels.find((urgency) => urgency.index === 0) ||
      null;

    if (value) {
      sendToParent({
        payload: {
          clean: state.matches('cleaned.true'),
          data: value,
          valid: state.matches('validation.valid'),
        },
        fieldName: 'urgency_level',
        type: 'UPDATE',
      });
    }
  }, [state.value, state.context]);

  return (
    <div className="mb-8">
      <label
        htmlFor={seed('referral-urgency-label')}
        className="mb-1 font-semibold"
      >
        <FormattedMessage {...messages.label} />
      </label>
      <p
        id={seed('referral-urgency-description')}
        className="text-gray-500 mt-0 mb-1"
      >
        <FormattedMessage {...messages.description} />
      </p>
      <select
        className="form-control"
        id={seed('referral-urgency-label')}
        name="urgency"
        aria-describedby={seed('referral-urgency-description')}
        value={
          state.context.value?.id ||
          urgencyLevels.find((urgency) => urgency.index === 0)?.id
        }
        onChange={(e) =>
          send({
            type: 'CHANGE',
            data: urgencyLevels.find(
              (urgency) => String(urgency.id) === String(e.target.value),
            )!,
          })
        }
      >
        {urgencyLevels.map((urgency) => (
          <option key={urgency.id} value={urgency.id}>
            {urgency.name}
          </option>
        ))}
      </select>
    </div>
  );
};
