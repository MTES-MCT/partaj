import * as Sentry from '@sentry/react';
import debounce from 'lodash-es/debounce';
import { stringify } from 'query-string';
import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import Autosuggest, {
  SuggestionsFetchRequestedParams,
} from 'react-autosuggest';
import {
  defineMessages,
  FormattedMessage,
  MessageDescriptor,
  useIntl,
} from 'react-intl';

import { appData } from 'appData';
import { getUserFullname } from 'utils/user';
import {
  FilterColumns,
  FiltersDict,
  QueryAutosuggestProps,
  Suggestion,
  SuggestionSection,
} from './types';

const messages = defineMessages({
  queryPlaceholder: {
    defaultMessage: 'Search in referrals',
    description: 'Placeholder for the query input in referral table.',
    id: 'components.ReferralTable.Input.queryPlaceholder',
  },
  suggestionSectionAssignees: {
    defaultMessage: 'Assignees',
    description:
      'Title for the suggestion section in the search autocomplete dropdown.',
    id: 'components.ReferralTable.Input.suggestionSectionAssignees',
  },
  suggestionSectionTopics: {
    defaultMessage: 'Topics',
    description:
      'Title for the suggestion section in the search autocomplete dropdown.',
    id: 'components.ReferralTable.Input.suggestionSectionTopics',
  },
  suggestionSectionUnits: {
    defaultMessage: 'Units',
    description:
      'Title for the suggestion section in the search autocomplete dropdown.',
    id: 'components.ReferralTable.Input.suggestionSectionUnits',
  },
  suggestionSectionUsers: {
    defaultMessage: 'Requesters',
    description:
      'Title for the suggestion section in the search autocomplete dropdown.',
    id: 'components.ReferralTable.Input.suggestionSectionUsers',
  },
});

const SUGGESTION_SECTIONS = [
  {
    column: FilterColumns.TOPIC,
    kind: 'topiclites',
    title: messages.suggestionSectionTopics,
  },
  {
    column: FilterColumns.UNIT,
    kind: 'unitlites',
    title: messages.suggestionSectionUnits,
  },
  {
    column: FilterColumns.USER,
    kind: 'userlites',
    title: messages.suggestionSectionUsers,
  },
  {
    column: FilterColumns.ASSIGNEE,
    kind: 'userlites',
    title: messages.suggestionSectionAssignees,
  },
];

/**
 * `react-autosuggest` callback to get a human string value from a Suggestion object.
 * @param suggestion The relevant suggestion object.
 */
export const getSuggestionValue: Autosuggest.GetSuggestionValue<Suggestion> = (
  suggestion,
) => {
  switch (suggestion.kind) {
    case 'topiclites':
      return suggestion.value.name;
    case 'unitlites':
      return suggestion.value.name;
    case 'userlites':
      return getUserFullname(suggestion.value);
  }
};

/**
 * Build a suggestion section from a model name and a title, requesting the relevant
 * values to populate it from the API
 * @param kind The kind of suggestion we're issuing the completion request for. Determines the API
 * endpoint we're sending the request to.
 * @param title MessageDescriptor for the title of the section that displays the suggestions.
 * @param query The actual payload to run the completion search with.
 */
export const getSuggestionsSection = async (
  {
    column,
    kind,
    title,
  }: { column: FilterColumns; kind: string; title: MessageDescriptor },
  query: string,
) => {
  // Run the search for the section on the API
  let response: Response;
  try {
    response = await fetch(
      `/api/${kind}/autocomplete/?${stringify({ query })}`,
      {
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    Sentry.captureException(error);
    return;
  }

  if (!response.ok) {
    Sentry.captureException(
      response.status === 400
        ? await response.json()
        : new Error(
            `Failed to get list from ${kind} autocomplete : ${response.status}`,
          ),
    );
    return;
  }

  let responseData: { count: number; results: Suggestion['value'][] };
  try {
    responseData = await response.json();
  } catch (error) {
    Sentry.captureException(
      new Error('Failed to decode JSON in getSuggestionSection ' + error),
    );
    return;
  }

  return {
    kind,
    title,
    values: responseData.results
      .filter((_, index) => index < 3)
      .map((value) => ({ column, kind, value })),
  };
};

/**
 * `react-autosuggest` callback to build up the list of suggestions and sections whenever user
 * interaction requires us to create or update that list.
 * @param filters The general filters object as returned by the API on a course search.
 * @param setSuggestions The suggestion setter method for the component using our helper.
 * @param incomingValue The current value of the search suggest form field.
 */
const onSuggestionsFetchRequested = async (
  setSuggestions: (suggestions: SuggestionSection[]) => void,
  params: SuggestionsFetchRequestedParams,
) => {
  if (params.value.length < 3) {
    return setSuggestions([]);
  }

  // Fetch the suggestions for each resource-based section to build out the sections
  let sections: SuggestionSection[];
  try {
    sections = (
      await Promise.all(
        SUGGESTION_SECTIONS.map((filterdef) =>
          getSuggestionsSection(filterdef, params.value),
        ),
        // We can assert this because of the catch below
      )
    ).filter((section) => !!section) as SuggestionSection[];
  } catch (error) {
    Sentry.captureException(error);
    return;
  }

  setSuggestions(
    // Drop sections with no results as there's no use displaying them
    sections.filter((section) => !!section!.values.length),
  );
};

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
  const updateSearchParamsDebounced = useCallback(
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
      updateSearchParamsDebounced(_, { method, newValue });
    },
    placeholder: intl.formatMessage(messages.queryPlaceholder),
    value,
  };

  return (
    <div className="react-autosuggest-with-sections">
      <Autosuggest
        getSectionSuggestions={(section) => section.values}
        getSuggestionValue={getSuggestionValue}
        inputProps={inputProps}
        multiSection={true}
        onSuggestionsClearRequested={() => setSuggestions([])}
        onSuggestionsFetchRequested={(params) =>
          onSuggestionsFetchRequested(setSuggestions, params)
        }
        onSuggestionSelected={(_, { suggestion }) => {
          // Add the suggestion to the existing list for the filter, if it exists, and
          // deduplicate. Otherwise create the list with this one suggestion.
          setFilters((filters) => ({
            ...filters,
            [suggestion.column]: filters[suggestion.column]
              ? [
                  ...new Set([
                    ...filters[suggestion.column]!,
                    suggestion.value.id,
                  ]),
                ]
              : [suggestion.value.id],
            query: '',
          }));
          // Empty full-text search so the user can make see results with the newly added filter
          setValue('');
        }}
        renderSectionTitle={(section) => (
          <FormattedMessage {...section.title} />
        )}
        renderSuggestion={(suggestion) => (
          <span>{getSuggestionValue(suggestion)}</span>
        )}
        shouldRenderSuggestions={(val) => val.length > 2}
        suggestions={suggestions}
      />
    </div>
  );
};
