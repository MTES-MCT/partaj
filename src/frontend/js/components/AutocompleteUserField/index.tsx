import React, { useState } from 'react';
import Autosuggest, { InputProps } from 'react-autosuggest';
import { QueryFunction, QueryKey, useQueryClient } from 'react-query';

import { fetchList } from 'data/fetchList';
import * as types from 'types';
import { Nullable } from 'types/utils';
import { getUserFullname } from 'utils/user';

interface AutocompleteUserFieldProps {
  filterSuggestions?: Nullable<
    (suggestions: types.UserLite[]) => types.UserLite[]
  >;
  inputProps?: Partial<InputProps<types.UserLite>>;
  onSuggestionSelected: (suggestion: types.UserLite) => void;
}

export const AutocompleteUserField = ({
  filterSuggestions,
  inputProps = {},
  onSuggestionSelected,
}: AutocompleteUserFieldProps) => {
  const queryClient = useQueryClient();

  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<types.UserLite[]>([]);

  const getUsers: Autosuggest.SuggestionsFetchRequested = async ({ value }) => {
    const users: types.APIList<types.UserLite> = await queryClient.fetchQuery(
      ['users', { query: value }],
      fetchList as QueryFunction<any, QueryKey>,
    );
    setSuggestions(
      filterSuggestions ? filterSuggestions(users.results) : users.results,
    );
  };

  return (
    <Autosuggest
      suggestions={suggestions}
      onSuggestionsFetchRequested={getUsers}
      onSuggestionsClearRequested={() => setSuggestions([])}
      onSuggestionSelected={(_, { suggestion }) =>
        onSuggestionSelected(suggestion)
      }
      getSuggestionValue={(userLite) => getUserFullname(userLite)}
      renderSuggestion={(userLite) => getUserFullname(userLite)}
      inputProps={{
        ...inputProps,
        onBlur: (_, event) => {
          // If a given suggestion was highlighted, pick it as the selected user
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
