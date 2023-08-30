import React, { useEffect, useState } from 'react';

import {
  useFiltersNoteLitesAction,
  useNoteLitesAction,
} from '../../data/notes';
import { NoteLite } from '../../types';
import { NoteItem } from './NoteItem';
import { SearchNoteButton } from '../buttons/SearchNoteButton';
import { useCurrentUser } from '../../data/useCurrentUser';
import { SearchSelect } from '../select/SearchSelect';
import { ItemStyle, RemovableItem } from '../generics/RemovableItem';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { toCamel } from '../../utils/string';
import { dateToString } from '../../utils/date';
import { DateSelect } from '../select/DateSelect';
import { UsageGuide } from './UsageGuide';

const messages = defineMessages({
  knowledgeDatabaseTitle: {
    defaultMessage: 'Knowledge Database',
    description: 'Knowledge Database main title',
    id: 'components.NoteListView.knowledgeDatabaseTitle',
  },
  searchInputPlaceholder: {
    defaultMessage: 'Search for term',
    description: 'search input placeholder',
    id: 'components.NoteListView.searchInputPlaceholder',
  },
  searchingText: {
    defaultMessage: 'Searching for notes',
    description: 'search text waiting for results',
    id: 'components.NoteListView.searchingText',
  },
  topic: {
    defaultMessage: 'Notes Topic',
    description: 'Topic filter text',
    id: 'components.NoteListView.topic',
  },
  assignedUnitsNames: {
    defaultMessage: 'Notes assigned unit name',
    description: 'Assigned unit name filter text',
    id: 'components.NoteListView.assignedUnitsNames',
  },
  author: {
    defaultMessage: 'Notes Author',
    description: 'Author filter text',
    id: 'components.NoteListView.author',
  },
  contributors: {
    defaultMessage: 'Notes Contributors',
    description: 'Contributors filter text',
    id: 'components.NoteListView.contributors',
  },
  requestersUnitNames: {
    defaultMessage: 'Notes requester unit name',
    description: 'Requester unit name filter text',
    id: 'components.NoteListView.requestersUnitNames',
  },
  activeFilter: {
    defaultMessage: 'Active filters:',
    description: 'Active filter text',
    id: 'components.NoteListView.activeFilters',
  },
  resultCountText: {
    defaultMessage: '{ count } result(s)',
    description: 'Result count text',
    id: 'components.NoteListView.resultCountText',
  },
  resetFilters: {
    defaultMessage: 'Reset filters:',
    description: 'Reset filter button text',
    id: 'components.NoteListView.resetFilters',
  },
  noResultMessage: {
    defaultMessage:
      "Gosh, we can't find any results associated with your search. Please try again and specify your request!",
    description: 'No result message',
    id: 'components.NoteListView.noResultMessage',
  },
});

type MessageKeys =
  | 'topic'
  | 'assignedUnitsNames'
  | 'contributors'
  | 'requestersUnitNames';

export enum FilterKeys {
  TOPIC = 'topic',
  CONTRIBUTORS = 'contributors',
  REQUESTER_UNIT_NAMES = 'requesters_unit_names',
  ASSIGNED_UNIT_NAMES = 'assigned_units_names',
  PUBLICATION_DATE_AFTER = 'publication_date_after',
  PUBLICATION_DATE_BEFORE = 'publication_date_before',
}

export type NoteFilters = {
  [key in FilterKeys]: Array<NoteFilter>;
};

export type NoteFilter = {
  displayValue: string | undefined;
  value: string;
};

export const NoteListView: React.FC = () => {
  const [isInitialized, setInitialized] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [notes, setNotes] = useState<Array<NoteLite>>([]);
  const [count, setCount] = useState<number>(0);
  const [filters, setFilters] = useState<Array<any>>([]);
  const [activeFilters, setActiveFilters] = useState<NoteFilters>({
    [FilterKeys.TOPIC]: [],
    [FilterKeys.CONTRIBUTORS]: [],
    [FilterKeys.REQUESTER_UNIT_NAMES]: [],
    [FilterKeys.ASSIGNED_UNIT_NAMES]: [],
    [FilterKeys.PUBLICATION_DATE_AFTER]: [],
    [FilterKeys.PUBLICATION_DATE_BEFORE]: [],
  });
  const intl = useIntl();
  const { currentUser } = useCurrentUser();

  const notesMutation = useNoteLitesAction({
    onSuccess: (data, variables, context) => {
      setNotes(data.results.hits.hits);
      setCount(data.results.hits.total.value);
      !isInitialized && setInitialized(true);
    },
  });

  const sortByOrder = (objs: Array<any>, filters: any) =>
    objs.sort((a, b) => filters[a].meta.order - filters[b].meta.order);

  const filtersMutation = useFiltersNoteLitesAction({
    onSuccess: (data: any) => {
      setFilters(data.aggregations);
    },
  });

  const removeActiveFilter = (key: string, value: string) => {
    if (
      [
        FilterKeys.PUBLICATION_DATE_BEFORE,
        FilterKeys.PUBLICATION_DATE_AFTER,
      ].includes(key as FilterKeys)
    ) {
      setActiveFilters((prevState) => {
        if (
          (key === FilterKeys.PUBLICATION_DATE_AFTER &&
            prevState.hasOwnProperty(FilterKeys.PUBLICATION_DATE_BEFORE) &&
            prevState[FilterKeys.PUBLICATION_DATE_BEFORE][0] &&
            !prevState[FilterKeys.PUBLICATION_DATE_BEFORE][0].displayValue) ||
          (key === FilterKeys.PUBLICATION_DATE_BEFORE &&
            prevState[FilterKeys.PUBLICATION_DATE_AFTER][0] &&
            !prevState[FilterKeys.PUBLICATION_DATE_AFTER][0].displayValue)
        ) {
          prevState[FilterKeys.PUBLICATION_DATE_AFTER] = [];
          prevState[FilterKeys.PUBLICATION_DATE_BEFORE] = [];
        } else {
          const defaultKey =
            key === FilterKeys.PUBLICATION_DATE_BEFORE
              ? dateToString(new Date())
              : dateToString(new Date(2020, 0, 1));

          prevState[key as keyof NoteFilters] = [
            {
              value: defaultKey as string,
              displayValue: undefined,
            },
          ];
        }

        return { ...prevState };
      });
    } else {
      setActiveFilters((prevState) => {
        prevState[key as keyof NoteFilters] = prevState[
          key as keyof NoteFilters
        ].filter((filter) => filter.value !== value);

        return { ...prevState };
      });
    }
  };

  const resetFilters = () => {
    setActiveFilters({
      [FilterKeys.TOPIC]: [],
      [FilterKeys.CONTRIBUTORS]: [],
      [FilterKeys.REQUESTER_UNIT_NAMES]: [],
      [FilterKeys.ASSIGNED_UNIT_NAMES]: [],
      [FilterKeys.PUBLICATION_DATE_AFTER]: [],
      [FilterKeys.PUBLICATION_DATE_BEFORE]: [],
    });
  };

  const updateDateFilter = (
    publicationDateAfter: Date,
    publicationDateBefore: Date,
  ) => {
    setActiveFilters((prevState) => {
      prevState['publication_date_before'] = [
        {
          value: dateToString(publicationDateBefore) as string,
          displayValue: dateToString(publicationDateBefore),
        },
      ];
      prevState['publication_date_after'] = [
        {
          value: dateToString(publicationDateAfter) as string,
          displayValue: dateToString(publicationDateAfter),
        },
      ];

      return { ...prevState };
    });
  };

  const toggleActiveFilter = (key: keyof NoteFilters, option: string) => {
    setActiveFilters((prevState) => {
      if (!prevState.hasOwnProperty(key)) {
        return {
          ...prevState,
          [key]: [{ value: option, displayValue: option }],
        };
      }

      prevState[key] = prevState[key]
        .map((filter) => filter.value)
        .includes(option)
        ? prevState[key].filter((filter) => filter.value !== option)
        : [...prevState[key], { value: option, displayValue: option }];

      return { ...prevState };
    });
  };

  const hasActiveFilter = () => {
    for (const key in activeFilters) {
      if (activeFilters[key as keyof NoteFilters].length > 0) {
        return true;
      }
    }
    return false;
  };

  const getDateRange = () => {
    const from = activeFilters.hasOwnProperty(FilterKeys.PUBLICATION_DATE_AFTER)
      ? activeFilters[FilterKeys.PUBLICATION_DATE_AFTER][0] &&
        activeFilters[FilterKeys.PUBLICATION_DATE_AFTER][0].value
      : undefined;

    const to = activeFilters.hasOwnProperty(FilterKeys.PUBLICATION_DATE_BEFORE)
      ? activeFilters[FilterKeys.PUBLICATION_DATE_BEFORE][0] &&
        activeFilters[FilterKeys.PUBLICATION_DATE_BEFORE][0].value
      : undefined;

    return { from, to };
  };

  useEffect(() => {
    if (inputValue === '' && notesMutation.isIdle && !isInitialized) {
      notesMutation.mutate({ query: inputValue, ...activeFilters });
    }

    if (filters.length === 0 && filtersMutation.isIdle) {
      filtersMutation.mutate({});
    }
  });

  useEffect(() => {
    notesMutation.mutate({ query: inputValue, ...activeFilters });
  }, [activeFilters]);

  return (
    <>
      {currentUser && currentUser.has_db_access && (
        <div className="font-marianne notes relative flex flex-col flex-grow items-center">
          <div className="w-full flex items-center justify-center flex-col mb-2">
            <a
              href={`/app/notes`}
              className="text-primary-1000 text-2xl font-bold mb-6"
            >
              <FormattedMessage {...messages.knowledgeDatabaseTitle} />
            </a>
            <div className="flex flex-col w-full max-w-480">
              <form
                className="flex w-full relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  notesMutation.mutate({
                    query: inputValue,
                    ...activeFilters,
                  });
                }}
              >
                <input
                  placeholder={intl.formatMessage(
                    messages.searchInputPlaceholder,
                  )}
                  className={`note-search-input note-search-input-gray`}
                  type="text"
                  aria-label="search-text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                  }}
                />
                <SearchNoteButton />
              </form>
              <div className="w-full px-4 pt-1 pb-3 flex justify-between">
                <span className="text-s text-primary-1000">
                  <FormattedMessage
                    {...messages.resultCountText}
                    values={{ count }}
                  />
                </span>
                <UsageGuide />
              </div>
            </div>
          </div>

          <div className="flex flex-col min-w-640 justify-start items-start">
            <div className="flex mb-4">
              {filtersMutation.isSuccess && (
                <div className="flex items-center justify-start space-x-4">
                  {sortByOrder(Object.keys(filters), filters).map((key) => (
                    <SearchSelect
                      key={`id-${key}`}
                      name={
                        Object.keys(messages).includes(toCamel(key))
                          ? intl.formatMessage(
                              messages[toCamel(key) as MessageKeys],
                            )
                          : ''
                      }
                      filterKey={key}
                      options={filters[key as any].buckets}
                      activeOptions={
                        activeFilters.hasOwnProperty(key)
                          ? (activeFilters[key as keyof NoteFilters].map(
                              (filter) => filter.value,
                            ) as Array<string>)
                          : ([] as Array<string>)
                      }
                      onOptionClick={toggleActiveFilter}
                    />
                  ))}
                  <DateSelect
                    range={getDateRange()}
                    onSelectRange={(from, to) => {
                      updateDateFilter(from, to);
                    }}
                  />
                </div>
              )}
            </div>
            {activeFilters && hasActiveFilter() && (
              <div className="flex mb-4 space-y-2 max-w-640 flex-wrap">
                <span className="flex items-center text-s font-medium mx-2 mt-2 whitespace-nowrap">
                  <FormattedMessage {...messages.activeFilter} />
                </span>
                {Object.keys(activeFilters).map(
                  (key) =>
                    activeFilters.hasOwnProperty(key) &&
                    activeFilters[key as keyof NoteFilters].map((filter) => (
                      <>
                        {filter.displayValue && (
                          <RemovableItem
                            key={filter.value as string}
                            iconSize={5}
                            style={ItemStyle.NOTES}
                            removeItem={() =>
                              removeActiveFilter(key, filter.value as string)
                            }
                          >
                            <>{filter.displayValue}</>
                          </RemovableItem>
                        )}
                      </>
                    )),
                )}
                <button
                  className={`button text-s underline button-superfit`}
                  onClick={() => resetFilters()}
                >
                  <FormattedMessage {...messages.resetFilters} />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-grow flex-col w-full max-w-640 items-center">
            {notesMutation.isLoading && (
              <>
                <FormattedMessage {...messages.searchingText} />
              </>
            )}
            {notesMutation.isSuccess && notes && (
              <>
                {notes.length > 0 ? (
                  <>
                    {notes.map((note: NoteLite) => (
                      <NoteItem key={note._id} note={note} />
                    ))}
                  </>
                ) : (
                  <span className="mt-16 italic">
                    <FormattedMessage {...messages.noResultMessage} />
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
