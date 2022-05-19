import React, { useState } from 'react';
import Autosuggest, { InputProps } from 'react-autosuggest';
import { QueryFunction, QueryKey, useQueryClient } from 'react-query';

import { fetchList } from 'data/fetchList';
import * as types from 'types';
import { Nullable } from 'types/utils';

interface AutocompleteUnitFieldProps {
  filterSuggestions?: Nullable<(suggestions: types.Unit[]) => types.Unit[]>;
  inputProps?: Partial<InputProps<types.Unit>>;
  onSuggestionSelected: (suggestion: types.Unit) => void;
}

export const AutocompleteUnitField = ({
  filterSuggestions,
  inputProps = {},
  onSuggestionSelected,
}: AutocompleteUnitFieldProps) => {
  const queryClient = useQueryClient();

  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<types.Unit[]>([]);

  const getUsers: Autosuggest.SuggestionsFetchRequested = async ({ value }) => {
    const units: types.APIList<types.Unit> = await queryClient.fetchQuery(
      ['units', { query: value }],
      fetchList as QueryFunction<any, QueryKey>,
    );
    setSuggestions(
      filterSuggestions ? filterSuggestions(units.results) : units.results,
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
      getSuggestionValue={(unit) => unit.name}
      renderSuggestion={(unit) => unit.name}
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
