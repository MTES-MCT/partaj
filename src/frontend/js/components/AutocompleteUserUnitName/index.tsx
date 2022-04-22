import React, { useState } from 'react';
import Autosuggest, { InputProps } from 'react-autosuggest';
import { QueryFunction, QueryKey, useQueryClient } from 'react-query';

import { fetchList } from 'data/fetchList';
import * as types from 'types';
import { Nullable } from 'types/utils';

interface AutocompleteUserUnitNameProps {
  filterSuggestions?: Nullable<
    (suggestions: types.UserLite[]) => types.UserLite[]
  >;
  inputProps?: Partial<InputProps<types.UserLite>>;
  onSuggestionSelected: (suggestion: types.UserLite) => void;
}

export const AutocompleteUserUnitName = ({
  filterSuggestions,
  inputProps = {},
  onSuggestionSelected,
}: AutocompleteUserUnitNameProps) => {
  const queryClient = useQueryClient();

  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<types.UserLite[]>([]);

  const getUsers: Autosuggest.SuggestionsFetchRequested = async ({ value }) => {
    const users: types.APIList<types.UserLite> = await queryClient.fetchQuery(
      ['users', { query: value, type: 'unit_name' }],
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
      shouldRenderSuggestions={(value, reason) => {
        return value.trim().length > 1;
      }}
      onSuggestionSelected={(_, { suggestion }) =>
        onSuggestionSelected(suggestion)
      }
      getSuggestionValue={(userLite) => userLite.unit_name}
      renderSuggestion={(userLite) => userLite.unit_name}
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
          // Whenever there is a change in the value, if the new value matches one of our
          // suggestions (the way the user sees it), pick it as the selected user.
          const suggestion = suggestions.find(
            (userLite) => userLite.unit_name === newValue,
          );
          if (suggestion) {
            onSuggestionSelected(suggestion);
          }
        },
        value,
      }}
    />
  );
};
