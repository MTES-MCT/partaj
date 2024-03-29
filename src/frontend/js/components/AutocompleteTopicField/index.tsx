import React, { useState } from 'react';
import Autosuggest, { InputProps } from 'react-autosuggest';
import { QueryFunction, QueryKey, useQueryClient } from 'react-query';
import { fetchList } from 'data/fetchList';
import * as types from 'types';
import { Nullable } from 'types/utils';
import { calcTopicItemDepth } from 'utils/topics';

interface AutocompleteTopicFieldProps {
  filterSuggestions?: Nullable<(suggestions: types.Topic[]) => types.Topic[]>;
  inputProps?: Partial<InputProps<types.Topic>>;
  onSuggestionSelected: (suggestion: types.Topic) => void;
}

export const AutocompleteTopicField = ({
  filterSuggestions,
  inputProps = {},
  onSuggestionSelected,
}: AutocompleteTopicFieldProps) => {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<types.Topic[]>([]);

  const getTopics: Autosuggest.SuggestionsFetchRequested = async ({
    value,
  }) => {
    const topics: types.APIList<types.Topic> = await queryClient.fetchQuery(
      ['topics', { query: value }],
      fetchList as QueryFunction<any, QueryKey>,
    );

    setSuggestions(
      filterSuggestions ? filterSuggestions(topics.results) : topics.results,
    );
  };

  return (
    <Autosuggest
      suggestions={suggestions}
      onSuggestionsFetchRequested={getTopics}
      onSuggestionsClearRequested={() => setSuggestions([])}
      onSuggestionSelected={(_, { suggestion }) =>
        onSuggestionSelected(suggestion)
      }
      getSuggestionValue={(topic) => topic.name}
      renderSuggestion={(topic) => (
        <div
          className={`cursor-pointer ${calcTopicItemDepth(
            topic.path.length / 4,
          )}`}
        >
          {topic.name}
        </div>
      )}
      inputProps={{
        ...inputProps,
        onBlur: (_, event) => {
          // If a given suggestion was highlighted, pick it as the selected unit
          if (event?.highlightedSuggestion) {
            onSuggestionSelected(event!.highlightedSuggestion);
          }
        },
        onChange: (_, { newValue }) => {
          setValue(newValue);
        },
        value,
      }}
    />
  );
};
