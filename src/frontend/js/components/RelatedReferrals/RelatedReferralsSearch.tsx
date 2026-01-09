import React, { Fragment, useEffect, useState } from 'react';

import {
  useFiltersNoteLitesAction,
  useNoteLitesAction,
} from '../../data/notes';
import { NoteLite, ReferralRelationship } from '../../types';
import { useCurrentUser } from '../../data/useCurrentUser';
import { Option, SearchMultiSelect } from '../select/SearchMultiSelect';
import { RemovableItem } from '../generics/RemovableItem';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { toCamel } from '../../utils/string';
import { dateToString } from '../../utils/date';
import { DateSelect } from '../select/DateSelect';
import { DateRange } from 'react-day-picker';
import { NoteItem } from '../Notes/NoteItem';
import { AddRelationShipButton } from '../buttons/AddRelatedReferralButton';
import { CrossIcon, SearchIcon } from '../Icons';

const messages = defineMessages({
  searchInputPlaceholder: {
    defaultMessage: 'Search for term',
    description: 'search input placeholder',
    id: 'components.NoteListView.searchInputPlaceholder',
  },
  label: {
    defaultMessage: 'Start note search',
    description: 'Accessibility label for the search note button',
    id: 'components.buttons.SearchNoteButton.label',
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
  value: string | Date | undefined;
};

export const RelatedReferralsSearch: React.FC<{
  referralId: string;
  setRelationships: Function;
  relationships: ReferralRelationship[];
}> = ({ referralId, setRelationships, relationships }) => {
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
    objs.sort((a, b) => filters[a].order - filters[b].order);

  const filtersMutation = useFiltersNoteLitesAction({
    onSuccess: (data: any) => {
      setFilters(data);
    },
  });

  const removeActiveFilter = (key: string, value: string | Date) => {
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
              ? new Date()
              : new Date(2020, 0, 1);

          prevState[key as keyof NoteFilters] = [
            {
              value: defaultKey as string | Date,
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
    publicationDateAfter?: Date,
    publicationDateBefore?: Date,
  ) => {
    setActiveFilters((prevState) => {
      prevState['publication_date_before'] = [
        {
          value: publicationDateBefore,
          displayValue: dateToString(publicationDateBefore),
        },
      ];
      prevState['publication_date_after'] = [
        {
          value: publicationDateAfter,
          displayValue: dateToString(publicationDateAfter),
        },
      ];

      return { ...prevState };
    });
  };

  const toggleActiveFilter = (key: keyof NoteFilters, option: Option) => {
    setActiveFilters((prevState) => {
      if (!prevState.hasOwnProperty(key)) {
        return {
          ...prevState,
          [key]: [{ value: option.id, displayValue: option.name }],
        };
      }

      prevState[key] = prevState[key]
        .map((filter) => filter.value)
        .includes(option.id)
        ? prevState[key].filter((filter) => filter.value !== option.id)
        : [...prevState[key], { value: option.id, displayValue: option.name }];

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
        (activeFilters[FilterKeys.PUBLICATION_DATE_AFTER][0].value as Date)
      : undefined;

    const to = activeFilters.hasOwnProperty(FilterKeys.PUBLICATION_DATE_BEFORE)
      ? activeFilters[FilterKeys.PUBLICATION_DATE_BEFORE][0] &&
        (activeFilters[FilterKeys.PUBLICATION_DATE_BEFORE][0].value as Date)
      : undefined;

    return { from, to };
  };

  useEffect(() => {
    if (inputValue === '' && notesMutation.isIdle && !isInitialized) {
      notesMutation.mutate({ query: inputValue, ...activeFilters });
    }

    if (Object.keys(filters).length === 0 && filtersMutation.isIdle) {
      filtersMutation.mutate({});
    }
  });

  useEffect(() => {
    notesMutation.mutate({ query: inputValue, ...activeFilters });
  }, [activeFilters]);

  return (
    <>
      {currentUser && currentUser.has_db_access && (
        <div className={`font-marianne notes relative flex flex-col flex-grow`}>
          <div className="mb-4">
            <h4 className="text-lg">Lier une autre saisine</h4>
            <p className="text-dsfr-grey-700 text-sm">
              Rechercher dans la base de connaissance pour ajouter une saisine
              liée à cette saisine
            </p>
          </div>
          <div className="w-full flex items-center justify-center flex-col mb-2">
            <div className="flex flex-col flex flex-col w-full items-start">
              <form
                className="flex w-fit relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  notesMutation.mutate({
                    query: inputValue,
                    ...activeFilters,
                  });
                }}
              >
                <input
                  title={intl.formatMessage(messages.searchInputPlaceholder)}
                  placeholder={intl.formatMessage(
                    messages.searchInputPlaceholder,
                  )}
                  name="note-search-input"
                  className={`bg-dsfr-grey-100 border-b-2 border-dsfr-primary-500 min-w-60 px-2 h-9 text-sm`}
                  type="text"
                  aria-label={intl.formatMessage(
                    messages.searchInputPlaceholder,
                  )}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                  }}
                />
                <button
                  className="absolute right-38 top-2 pr-2"
                  onClick={(e: any) => {
                    setInputValue('');
                    notesMutation.mutate({
                      query: '',
                      ...activeFilters,
                    });
                  }}
                >
                  <CrossIcon className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  aria-label={intl.formatMessage(messages.label)}
                  className="btn btn-primary bg-dsfr-primary-500 px-2 h-9"
                >
                  <SearchIcon className="w-6 h-6 fill-white" />
                </button>
              </form>

              <div className="w-full px-2 pt-1 pb-3 flex justify-between">
                <span className="text-s text-dsfr-primary-500">
                  <FormattedMessage
                    {...messages.resultCountText}
                    values={{ count }}
                  />
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col min-w-640 justify-start items-start">
            <div className="flex mb-4">
              {filtersMutation.isSuccess && (
                <div className="flex items-center justify-start space-x-4">
                  {sortByOrder(Object.keys(filters), filters).map((key) => (
                    <SearchMultiSelect
                      key={`id-${key}`}
                      name={
                        Object.keys(messages).includes(toCamel(key))
                          ? intl.formatMessage(
                              messages[toCamel(key) as MessageKeys],
                            )
                          : ''
                      }
                      filterKey={key}
                      options={filters[key].results}
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
                    modalPosition="right"
                    filterName={'Date de publication'}
                    range={getDateRange()}
                    onSelectRange={(dateRange?: DateRange) => {
                      updateDateFilter(dateRange?.from, dateRange?.to);
                    }}
                  />
                </div>
              )}
            </div>
            {activeFilters && hasActiveFilter() && (
              <div className="flex mb-4 space-y-2 max-w-640 flex-wrap">
                <span className="flex items-center text-s font-medium mx-2 mt-2 whitespace-nowrap uppercase text-primary-700">
                  <FormattedMessage {...messages.activeFilter} />
                </span>
                {Object.keys(activeFilters).map(
                  (key) =>
                    activeFilters.hasOwnProperty(key) &&
                    activeFilters[key as keyof NoteFilters].map((filter) => (
                      <Fragment key={filter.value as string}>
                        {filter.displayValue && (
                          <RemovableItem
                            iconClassName="w-5 h-5"
                            removeItem={() =>
                              removeActiveFilter(
                                key,
                                filter.value as string | Date,
                              )
                            }
                          >
                            <>{filter.displayValue}</>
                          </RemovableItem>
                        )}
                      </Fragment>
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
          <div className="flex flex-grow flex-col w-full items-center">
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
                      <div className="flex w-full space-x-4">
                        <NoteItem
                          key={note._id}
                          note={note}
                          page={'referral'}
                        />
                        <AddRelationShipButton
                          isAlreadyAdded={
                            relationships.filter(
                              (relationship) =>
                                String(relationship.related_referral.id) ===
                                String(note._source.referral_id),
                            ).length > 0
                          }
                          mainReferralId={referralId}
                          relatedReferralId={note._source.referral_id}
                          setRelationships={setRelationships}
                        />
                      </div>
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
