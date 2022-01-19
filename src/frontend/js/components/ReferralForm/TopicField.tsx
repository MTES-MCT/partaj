import { useMachine } from '@xstate/react';
import React, { useEffect, useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { QueryFunction, QueryKey, useQueryClient } from 'react-query';
import { useUIDSeed } from 'react-uid';
import { assign, Sender } from 'xstate';

import { appData } from 'appData';
import { useUnitMemberships } from 'data';
import { fetchList } from 'data/fetchList';
import * as types from 'types';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { getUserFullname } from 'utils/user';
import { TextFieldMachine, UpdateEvent } from './machines';
import { CleanAllFieldsProps } from '.';

import { Topic } from 'types';
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';

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
  noItemsfound: {
    defaultMessage: 'There are no topics matching your search.',
    description: 'Error message when no items found on topics list',
    id: 'components.ReferralForm.TopicFields.noItemsfound',
  },
  invalid: {
    defaultMessage: 'The topic chosen is not valid. choose one from the list.',
    description:
      'Error message showed when topic field has an invalid value in the referral form',
    id: 'components.ReferralForm.TopicFields.invalid',
  },
  mandatory: {
    defaultMessage:
      'This field is mandatory. Please select a topic in the list.',
    description:
      'Error message showed when topic field has an invalid value in the referral form',
    id: 'components.ReferralForm.ReferralForm.mandatory',
  },
  UnitOwnerInformations: {
    defaultMessage:
      '{unitOwnerCount, plural, one { {name} will be notifed of this referral.} other { {restNames} and {lastName} will be notifed of this referral.} }',
    description: 'Unit owner information.',
    id: 'components.ReferralForm.TopicFields.UnitOwnerInformations',
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
        {topic.unit_name}
      </div>
    </div>
  );
};

interface TopicFieldProps extends CleanAllFieldsProps {
  sendToParent: Sender<UpdateEvent>;
  topicValue?: Topic;
}

export const TopicField: React.FC<TopicFieldProps> = ({
  cleanAllFields,
  sendToParent,
  topicValue,
}) => {
  const intl = useIntl();
  const seed = useUIDSeed();
  const queryClient = useQueryClient();

  const [suggestions, setSuggestions] = useState<types.Topic[]>([]);
  const [value, setValue] = useState<string>('');
  const [isInputFocused, setisInputFocused] = useState<boolean>(false);
  const [unitId, setUnitId] = useState<string>('');

  const { data: unitMemberships } = useUnitMemberships(
    { unit: unitId },
    { enabled: !!unitId },
  );

  const ownerMemberships = unitMemberships?.results.filter(
    (membership) => membership.role === types.UnitMembershipRole.OWNER,
  );

  const getTopics: Autosuggest.SuggestionsFetchRequested = async ({
    value,
  }) => {
    const topics: types.APIList<types.Topic> = await queryClient.fetchQuery(
      ['topics', { query: value }],
      fetchList as QueryFunction<any, QueryKey>,
    );
    setSuggestions(topics.results);
  };

  useAsyncEffect(async () => {
    const topics: types.APIList<types.Topic> = await queryClient.fetchQuery(
      ['topics', { query: value }],
      fetchList as QueryFunction<any, QueryKey>,
    );
    setSuggestions(topics.results);
  }, []);

  const [state, send] = useMachine(TextFieldMachine, {
    /*context: {
      value: topicValue!.id,
    },*/
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

  useEffect(() => {
    if (topicValue !== null) {
      setValue(topicValue!.name);
      setUnitId(topicValue!.unit);
      send({ type: 'CHANGE', data: topicValue!.id });
    }
  }, []);

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
        onSuggestionsClearRequested={() => {
          setSuggestions([]);
        }}
        onSuggestionSelected={(_, { suggestion }) => {
          setUnitId(suggestion.unit);
          send({ type: 'CHANGE', data: suggestion.id });
        }}
        getSuggestionValue={(topic) => topic.name}
        renderSuggestion={(topic, { isHighlighted }) => (
          <TopicSuggestion {...{ topic, isHighlighted }} />
        )}
        shouldRenderSuggestions={() => true}
        renderSuggestionsContainer={({ containerProps, children, query }) => (
          <div {...containerProps}>
            {children}

            {!children &&
              query.length > 0 &&
              state.context.value.length === 0 &&
              isInputFocused && (
                <div className="p-4">
                  <FormattedMessage {...messages.noItemsfound} />
                </div>
              )}
          </div>
        )}
        inputProps={{
          id: seed('referral-topic-label'),
          'aria-describedby': seed('referral-topic-description'),
          placeholder: intl.formatMessage(messages.label),
          onChange: (_, { newValue }) => {
            if (state.context.value.length > 0)
              send({ type: 'CHANGE', data: '' });
            setValue(newValue);
          },
          onFocus: () => {
            setisInputFocused(true);
          },
          onBlur: () => {
            send('CLEAN');
            setisInputFocused(false);
            if (state.context.value.length === 0) setUnitId('');
          },
          value,
        }}
      />
      {state.matches('cleaned.true') &&
        state.matches('validation.invalid') &&
        (value.length === 0 ? (
          <div className="mt-4 text-danger-600">
            <FormattedMessage {...messages.mandatory} />
          </div>
        ) : (
          <div className="mt-4 text-danger-600">
            <FormattedMessage {...messages.invalid} />
          </div>
        ))}
      {ownerMemberships && ownerMemberships.length > 0 ? (
        <div className="m-2 flex flex-wrap content-between items-center">
          <svg
            role="img"
            aria-hidden="true"
            className="fill-current w-6 h-6 inline"
          >
            <use xlinkHref={`${appData.assets.icons}#icon-arrowright`} />
          </svg>
          <div className=" ml-2 max-w-lg px-2 py-1 rounded border border-gray-400 bg-gray-200">
            <FormattedMessage
              {...messages.UnitOwnerInformations}
              values={{
                unitOwnerCount: ownerMemberships.length,
                lastName: (
                  <b>
                    {getUserFullname(
                      ownerMemberships[ownerMemberships.length - 1].user,
                    )}
                  </b>
                ),
                restNames: (
                  <b>
                    {ownerMemberships
                      .slice(0, -1)
                      .map((membership) => getUserFullname(membership.user))
                      .join(', ')}
                  </b>
                ),
                name: <b>{getUserFullname(ownerMemberships[0].user)}</b>,
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};
