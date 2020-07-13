import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useQuery } from 'react-query';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { Spinner } from 'components/Spinner';
import { fetchList } from 'data/fetchList';
import { APIList, Urgency } from 'types';
import { ContextProps } from 'types/context';
import { TextFieldMachine, UpdateEvent } from './machines';

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

interface UrgencyFieldProps {
  sendToParent: Sender<UpdateEvent>;
}

export const UrgencyField: React.FC<UrgencyFieldProps & ContextProps> = ({
  context,
  sendToParent,
}) => {
  const intl = useIntl();
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
      fieldName: 'urgency',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  const { status, data } = useQuery<APIList<Urgency>, 'urgencies'>(
    'urgencies',
    fetchList(context),
  );

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
        onChange={(e) => send({ type: 'CHANGE', data: e.target.value })}
      >
        <option value="" defaultChecked={true}>
          {intl.formatMessage(messages.threeWeeks)}
        </option>
        {data!.results.map((urgency) => (
          <option key={urgency.name} value={urgency.name}>
            {urgency.text}
          </option>
        ))}
      </select>
    </div>
  );
};
