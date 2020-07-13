import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQuery } from 'react-query';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { Spinner } from 'components/Spinner';
import { fetchList } from 'data/fetchList';
import { APIList, Topic } from 'types';
import { ContextProps } from 'types/context';

import { TextFieldMachine, UpdateEvent } from './machines';

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

interface TopicFieldProps {
  sendToParent: Sender<UpdateEvent>;
}

export const TopicField: React.FC<TopicFieldProps & ContextProps> = ({
  context,
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
      fieldName: 'topic',
      type: 'UPDATE',
    });
  }, [state.value, state.context]);

  const { status, data } = useQuery<APIList<Topic>, 'topics'>(
    'topics',
    fetchList(context),
  );

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
        className="text-gray-600 mt-0 mb-1"
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
