import debounce from 'lodash-es/debounce';
import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { defineMessages, useIntl } from 'react-intl';

import { FiltersDict, QueryAutosuggestProps, SuggestionSection } from './types';

const messages = defineMessages({
  queryPlaceholder: {
    defaultMessage: 'Search in referrals',
    description: 'Placeholder for the query input in referral table.',
    id: 'components.ReferralTable.Input.queryPlaceholder',
  },
});

type QueryInputProps = {
  setFilters: Dispatch<SetStateAction<FiltersDict>>;
};

export const QueryInput = ({ setFilters }: QueryInputProps) => {
  const intl = useIntl();

  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionSection[]>([]);

  /**
   * Helper to update the course search params when the user types. We needed to take it out of
   * the `onChange` handler to wrap it in a `debounce` (and therefore a `useRef` to make the
   * debouncing effective).
   *
   * This method should be memoized and updated only when courseSearchParams change.
   *
   * @param _ Unused: change event.
   * @param params Incoming parameters related to the change event.
   * - `method` is the way the value was updated.
   * - `newValue` is the search suggest form field value.
   */
  const searchAsTheUserTypes: QueryAutosuggestProps['inputProps']['onChange'] = useCallback(
    (_, { method, newValue }) => {
      if (
        method === 'type' &&
        // Check length against trimmed version to only do full-text search with 3 or more
        // non-space characters.
        (newValue.length === 0 || newValue.trim().length >= 3)
      ) {
        setFilters((filters) => ({ ...filters, query: newValue }));
      }
    },
    [],
  );

  /**
   * Debounce the searchAsTheUserTypes method. We have to memoize it to prevent creation to a new
   * debounce timer at each render. We only update this function when searchAsTheUserTypes change.
   */
  const updateCourseSearchParamsDebounced = useCallback(
    debounce(searchAsTheUserTypes, 500, { maxWait: 1100 }),
    [searchAsTheUserTypes],
  );

  const inputProps: QueryAutosuggestProps['inputProps'] = {
    /**
     * Callback triggered on every user input.
     * @param _ Unused: change event.
     * @param params Incoming parameters related to the change event.
     * - `method` is the way the value was updated.
     * - `newValue` is the search suggest form field value.
     */
    onChange: (_, { method, newValue }) => {
      // Always update the state, delegate search-as-the-user-types to debounced function
      setValue(newValue);
      updateCourseSearchParamsDebounced(_, { method, newValue });
    },
    placeholder: intl.formatMessage(messages.queryPlaceholder),
    value,
  };

  return (
    <Autosuggest
      getSectionSuggestions={(section) => section.values}
      getSuggestionValue={(suggestion) => suggestion.title}
      inputProps={inputProps}
      multiSection={true}
      onSuggestionsClearRequested={() => setSuggestions([])}
      onSuggestionsFetchRequested={() => {}}
      onSuggestionSelected={() => {}}
      renderSectionTitle={(section) => section.title}
      renderSuggestion={(suggestion) => <span>{suggestion.title}</span>}
      shouldRenderSuggestions={(val) => val.length > 2}
      suggestions={suggestions as any}
    />
  );
};
