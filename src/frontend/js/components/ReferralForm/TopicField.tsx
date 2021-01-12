import { useMachine } from '@xstate/react';
import React, { useEffect, useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useQueryCache } from 'react-query';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { fetchList } from 'data/fetchList';
import * as types from 'types';
import { useAsyncEffect } from 'utils/useAsyncEffect';

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

const TopicSuggestion: React.FC<{
  topic: types.Topic;
  isHighlighted: boolean;
}> = ({ topic, isHighlighted }) => {
  const depth = topic.path.length / 4;

  let depthClass: string = '';
  switch (depth) {
    case 0:
    case 1:
      depthClass = '';
      break;

    case 2:
      depthClass = 'pl-6';
      break;

    case 3:
      depthClass = 'pl-10';
      break;

    default:
      depthClass = 'pl-14';
      break;
  }

  return (
    <div className={`cursor-pointer ${depthClass}`}>
      <div className={isHighlighted ? '' : 'text-gray-800'}>{topic.name}</div>
      <div className={isHighlighted ? '' : 'text-gray-700'}>
        {topic.unit.name}
      </div>
    </div>
  );
};

interface TopicFieldProps extends CleanAllFieldsProps {
  sendToParent: Sender<UpdateEvent>;
}

export const TopicField: React.FC<TopicFieldProps> = ({
  cleanAllFields,
  sendToParent,
}) => {
  const intl = useIntl();
  const seed = useUIDSeed();
  const queryCache = useQueryCache();

  const [suggestions, setSuggestions] = useState<types.Topic[]>([]);
  const [value, setValue] = useState<string>('');

  const getTopics: Autosuggest.SuggestionsFetchRequested = async ({
    value,
  }) => {
    const topics: types.APIList<types.Topic> = await queryCache.fetchQuery(
      ['topics', { query: value }],
      fetchList,
    );
    setSuggestions(topics.results);
  };

  useAsyncEffect(async () => {
    const topics: types.APIList<types.Topic> = await queryCache.fetchQuery(
      ['topics', { query: value }],
      fetchList,
    );
    setSuggestions(topics.results);
  }, []);

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
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={getTopics}
        onSuggestionsClearRequested={() => setSuggestions([])}
        onSuggestionSelected={(_, { suggestion }) =>
          send({ type: 'CHANGE', data: suggestion.id })
        }
        getSuggestionValue={(topic) => topic.name}
        renderSuggestion={(topic, { isHighlighted }) => (
          <TopicSuggestion {...{ topic, isHighlighted }} />
        )}
        shouldRenderSuggestions={() => true}
        inputProps={{
          id: seed('referral-topic-label'),
          'aria-describedby': seed('referral-topic-description'),
          placeholder: intl.formatMessage(messages.label),
          onChange: (_, { newValue }) => {
            setValue(newValue);
          },
          value,
        }}
      />
    </div>
  );
};
