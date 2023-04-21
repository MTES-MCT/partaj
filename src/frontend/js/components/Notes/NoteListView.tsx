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
});

type MessageKeys =
  | 'topic'
  | 'assignedUnitsNames'
  | 'author'
  | 'requestersUnitNames';

export enum FilterKeys {
  TOPIC = 'topic',
  AUTHOR = 'author',
  REQUESTER_UNIT_NAMES = 'requesters_unit_names',
  ASSIGNED_UNIT_NAMES = 'assigned_units_names',
}

export type NoteFilters = {
  [key in FilterKeys]: Array<string>;
};

export const NoteListView: React.FC = () => {
  const [isInitialized, setInitialized] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [notes, setNotes] = useState<Array<NoteLite>>([]);
  const [filters, setFilters] = useState<Array<any>>([]);
  const [activeFilters, setActiveFilters] = useState<NoteFilters>({
    [FilterKeys.TOPIC]: [],
    [FilterKeys.AUTHOR]: [],
    [FilterKeys.REQUESTER_UNIT_NAMES]: [],
    [FilterKeys.ASSIGNED_UNIT_NAMES]: [],
  });
  const intl = useIntl();
  const { currentUser } = useCurrentUser();

  const notesMutation = useNoteLitesAction({
    onSuccess: (data, variables, context) => {
      setNotes(data.results.hits.hits);
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
    setActiveFilters((prevState) => {
      prevState[key as keyof NoteFilters] = prevState[
        key as keyof NoteFilters
      ].filter((e) => e !== value);

      return { ...prevState };
    });
  };

  const toggleActiveFilter = (key: string, option: string) => {
    setActiveFilters((prevState) => {
      if (!prevState.hasOwnProperty(key)) {
        return { ...prevState, [key]: [option] };
      }

      prevState[key as keyof NoteFilters] = prevState[
        key as keyof NoteFilters
      ].includes(option)
        ? prevState[key as keyof NoteFilters].filter(
            (value) => value !== option,
          )
        : [...prevState[key as keyof NoteFilters], option];

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
          <div className="w-full flex items-center justify-center flex-col mb-6">
            <h1 className="text-primary-1000 mb-6">
              <FormattedMessage {...messages.knowledgeDatabaseTitle} />
            </h1>
            <form
              className="flex w-full max-w-480 relative"
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
          </div>
          <div className="flex flex-col min-w-640 justify-start items-start">
            <div className="flex mb-4">
              {filtersMutation.isSuccess && (
                <div className="flex items-center justify-start space-x-4">
                  {sortByOrder(Object.keys(filters), filters).map((key) => (
                    <SearchSelect
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
                          ? activeFilters[key as keyof NoteFilters]
                          : []
                      }
                      onOptionClick={toggleActiveFilter}
                    />
                  ))}
                </div>
              )}
            </div>
            {activeFilters && hasActiveFilter() && (
              <div className="flex mb-4 space-y-2 max-w-640 flex-wrap">
                <span className="flex items-center text-s font-medium mx-2 mt-2 whitespace-no-wrap">
                  <FormattedMessage {...messages.activeFilter} />
                </span>
                {Object.keys(activeFilters).map(
                  (key) =>
                    activeFilters.hasOwnProperty(key) &&
                    activeFilters[key as keyof NoteFilters].map((value) => (
                      <RemovableItem
                        key={value}
                        iconSize={5}
                        style={ItemStyle.NOTES}
                        removeItem={() => removeActiveFilter(key, value)}
                      >
                        {value}
                      </RemovableItem>
                    )),
                )}
              </div>
            )}
          </div>
          <div className="flex flex-grow flex-col w-full max-w-640 items-center">
            {notesMutation.isLoading && (
              <>
                <FormattedMessage {...messages.searchingText} />
              </>
            )}
            {notesMutation.isSuccess &&
              notes &&
              notes.map((note: NoteLite) => (
                <NoteItem key={note._id} note={note} />
              ))}
          </div>
        </div>
      )}
    </>
  );
};
