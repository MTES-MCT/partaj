import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQuery } from 'react-query';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { Spinner } from 'components/Spinner';
import { fetchList } from 'data/fetchList';
import { APIList, ReferralUrgency } from 'types';
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
  sendToParent: Sender<UpdateEvent<ReferralUrgency>>;
}

export const UrgencyField: React.FC<UrgencyFieldProps> = ({
  cleanAllFields,
  sendToParent,
}) => {
  const seed = useUIDSeed();

  const [state, send] = useMachine(UrgencyLevelFieldMachine, {
    actions: {
      setValue: assign({
        value: (_, event) => event.data,
      }),
    },
    guards: {
      isValid: () => true,
    },
  });

  const { status, data } = useQuery<APIList<ReferralUrgency>, 'urgencies'>(
    'urgencies',
    fetchList,
  );

  useEffect(() => {
    if (cleanAllFields) {
      send('CLEAN');
    }
  }, [cleanAllFields]);

  // Send an update to the parent whenever the state or context changes
  useEffect(() => {
    const value =
      state.context.value ||
      data?.results.find((urgency) => urgency.is_default) ||
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
  }, [state.value, state.context, data]);

  if (status === 'loading') {
    return (
      <Spinner size="large">
        <FormattedMessage {...messages.loadingUrgencies} />
      </Spinner>
    );
  }

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
        className="text-gray-600 mt-0 mb-1"
      >
        <FormattedMessage {...messages.description} />
      </p>
      <select
        className="form-control"
        id={seed('referral-urgency-label')}
        name="urgency"
        aria-describedby={seed('referral-urgency-description')}
        onChange={(e) =>
          send({
            type: 'CHANGE',
            data: data?.results.find(
              (urgency) => String(urgency.id) === String(e.target.value),
            )!,
          })
        }
      >
        {data!.results
          .sort((urgencyA, _) => (urgencyA.is_default ? -1 : 1))
          .map((urgency) => (
            <option key={urgency.id} value={urgency.id}>
              {urgency.name}
            </option>
          ))}
      </select>
    </div>
  );
};
