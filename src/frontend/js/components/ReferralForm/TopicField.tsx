import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { Spinner } from 'components/Spinner';
import { useTopics } from 'data';

import { TextFieldMachine, UpdateEvent } from './machines';
import { CleanAllFieldsProps } from '.';

const messages = defineMessages({
  description: {
    defaultMessage:
      'Broad topic to help direct the referral to the appropriate office',
    description: 'Description for the topic field in the referral form',
    id: 'components.ReferralForm.TopicField.description',
  },
  label: {
    defaultMessage: 'Referral topic',
    description: 'Label for the topic field in the referral form',
    id: 'components.ReferralForm.TopicField.label',
  },
  loadingTopics: {
    defaultMessage: 'Loading topics...',
    description:
      'Accessible text for the spinner while loading topics in the referral form',
    id: 'components.ReferralForm.TopicField.loadingTopics',
  },
});

interface TopicFieldProps extends CleanAllFieldsProps {
  sendToParent: Sender<UpdateEvent>;
}

export const TopicField: React.FC<TopicFieldProps> = ({
  cleanAllFields,
  sendToParent,
}) => {
  const seed = useUIDSeed();

  const { status, data } = useTopics();

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
      fieldName: 'topic',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  if (status === 'loading') {
    return (
      <Spinner size="large">
        <FormattedMessage {...messages.loadingTopics} />
      </Spinner>
    );
  }

  return (
    <div className="mb-8">
      <label
        htmlFor={seed('referral-topic-label')}
        className="mb-1 font-semibold"
      >
        <FormattedMessage {...messages.label} />
      </label>
      <p
        id={seed('referral-topic-description')}
        className="text-gray-500 mt-0 mb-1"
      >
        <FormattedMessage {...messages.description} />
      </p>
      <select
        className="form-control"
        id={seed('referral-topic-label')}
        name="topic"
        required={true}
        aria-describedby={seed('referral-topic-description')}
        onChange={(e) => send({ type: 'CHANGE', data: e.target.value })}
      >
        <option value="">---------</option>
        {data!.results.map((topic) => (
          <option key={topic.id} value={topic.id}>
            {topic.name}
          </option>
        ))}
      </select>
    </div>
  );
};
