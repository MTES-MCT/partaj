import React, { Dispatch, Fragment, SetStateAction } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQueries, UseQueryResult } from 'react-query';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { fetchList } from 'data/fetchList';
import { APIList, TopicLite, UnitLite, UserLite } from 'types';
import { referralStateMessages } from 'utils/sharedMessages';
import { getUserFullname } from 'utils/user';
import { sharedMessages } from './sharedMessages';
import { FilterColumns, FiltersDict } from './types';

const messages = defineMessages({
  dueDateFilter: {
    defaultMessage: 'Between {due_date_after} and {due_date_before}',
    description: 'Text for the filter label for due date filtering.',
    id: 'components.ReferralTable.EnabledFiltersList.dueDateFilter',
  },
  loadingActiveFilters: {
    defaultMessage: 'Loading active filters...',
    description:
      'Accessible alt text for the spinner while loading human readable filter values.',
    id: 'components.ReferralTable.EnabledFiltersList.loadingActiveFilters',
  },
  removeFilter: {
    defaultMessage: 'Remove filter',
    description:
      'Accessible title for the button to remove the related filter.',
    id: 'components.ReferralTable.EnabledFiltersList.removeFilter',
  },
});

interface EnabledFiltersListProps {
  filters: FiltersDict;
  setFilters: Dispatch<SetStateAction<FiltersDict>>;
}

export const EnabledFiltersList = ({
  filters,
  setFilters,
}: EnabledFiltersListProps) => {
  const seed = useUIDSeed();

  const filterQueriesArgs = [];
  if (filters[FilterColumns.TOPIC]?.length) {
    filterQueriesArgs.push({
      queryKey: ['topiclites', { id: filters[FilterColumns.TOPIC] }] as const,
      queryFn: fetchList as any,
    });
  }
  if (filters[FilterColumns.UNIT]?.length) {
    filterQueriesArgs.push({
      queryKey: ['unitlites', { id: filters[FilterColumns.UNIT] }] as const,
      queryFn: fetchList as any,
    });
  }
  if (filters[FilterColumns.ASSIGNEE]?.length) {
    filterQueriesArgs.push({
      queryKey: ['userlites', { id: filters[FilterColumns.ASSIGNEE] }] as const,
      queryFn: fetchList as any,
    });
  }
  if (filters[FilterColumns.USER]?.length) {
    filterQueriesArgs.push({
      queryKey: ['userlites', { id: filters[FilterColumns.USER] }] as const,
      queryFn: fetchList as any,
    });
  }
  const filterQueries = useQueries(filterQueriesArgs) as UseQueryResult<
    APIList<TopicLite | UnitLite | UserLite>
  >[];
  const allStatuses = filterQueries.map((query) => query.status);
  if (allStatuses.includes('error')) {
    return <GenericErrorMessage />;
  }
  if (allStatuses.includes('idle') || allStatuses.includes('loading')) {
    return (
      <Spinner>
        <FormattedMessage {...messages.loadingActiveFilters} />
      </Spinner>
    );
  }

  const allResults = filterQueriesArgs.reduce((acc, args, index) => {
    return {
      ...acc,
      [args.queryKey[0]]: filterQueries[index].data!.results.reduce(
        (innerAcc, item) => {
          return { ...innerAcc, [item.id]: item };
        },
        {},
      ),
    };
  }, {}) as {
    topiclites: { [key: string]: TopicLite };
    unitlites: { [key: string]: UnitLite };
    userlites: { [key: string]: UserLite };
  };

  return (
    <div className="flex flex-row items-center flex-wrap gap-2">
      {filters[FilterColumns.DUE_DATE] ? (
        <div className="tag tag-blue">
          <FormattedMessage {...sharedMessages[FilterColumns.DUE_DATE]} />:{' '}
          <FormattedMessage
            {...messages.dueDateFilter}
            values={{
              due_date_after: filters[FilterColumns.DUE_DATE]?.due_date_after,
              due_date_before: filters[FilterColumns.DUE_DATE]?.due_date_before,
            }}
          />
          <button
            onClick={() =>
              setFilters((existingFilters) => ({
                ...existingFilters,
                [FilterColumns.DUE_DATE]: undefined,
              }))
            }
            aria-labelledby={seed(FilterColumns.DUE_DATE)}
          >
            <svg role="img" className="w-5 h-5 -mr-2 fill-current">
              <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
              <title id={seed(FilterColumns.DUE_DATE)}>
                <FormattedMessage {...messages.removeFilter} />
              </title>
            </svg>
          </button>
        </div>
      ) : null}
      {filters[FilterColumns.STATE] ? (
        <Fragment>
          {filters[FilterColumns.STATE]!.map((state) => (
            <div className="tag tag-blue" key={state}>
              <FormattedMessage {...sharedMessages[FilterColumns.STATE]} />:{' '}
              <FormattedMessage {...referralStateMessages[state]} />
              <button
                onClick={() =>
                  setFilters((existingFilters) => ({
                    ...existingFilters,
                    [FilterColumns.STATE]:
                      existingFilters[FilterColumns.STATE]!.length === 1
                        ? undefined
                        : existingFilters[FilterColumns.STATE]!.filter(
                            (selectedState) => selectedState !== state,
                          ),
                  }))
                }
                aria-labelledby={seed(`${FilterColumns.STATE} - ${state}`)}
              >
                <svg role="img" className="w-5 h-5 -mr-2 fill-current">
                  <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
                  <title id={seed(`${FilterColumns.STATE} - ${state}`)}>
                    <FormattedMessage {...messages.removeFilter} />
                  </title>
                </svg>
              </button>
            </div>
          ))}
        </Fragment>
      ) : null}
      {filters[FilterColumns.USER_UNIT_NAME] ? (
        <Fragment>
          {filters[FilterColumns.USER_UNIT_NAME]!.map((unitName) => (
            <div className="tag tag-blue" key={unitName}>
              <FormattedMessage
                {...sharedMessages[FilterColumns.USER_UNIT_NAME]}
              />
              : {unitName}
              <button
                onClick={() =>
                  setFilters((existingFilters) => ({
                    ...existingFilters,
                    [FilterColumns.USER_UNIT_NAME]:
                      existingFilters[FilterColumns.USER_UNIT_NAME]!.length ===
                      1
                        ? undefined
                        : existingFilters[FilterColumns.USER_UNIT_NAME]!.filter(
                            (selectedUnit) => selectedUnit !== unitName,
                          ),
                  }))
                }
                aria-labelledby={seed(
                  `${FilterColumns.USER_UNIT_NAME} - ${unitName}}`,
                )}
              >
                <svg role="img" className="w-5 h-5 -mr-2 fill-current">
                  <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
                  <title
                    id={seed(`${FilterColumns.USER_UNIT_NAME} - ${unitName}`)}
                  >
                    <FormattedMessage {...messages.removeFilter} />
                  </title>
                </svg>
              </button>
            </div>
          ))}
        </Fragment>
      ) : null}
      {filters[FilterColumns.ASSIGNEE] ? (
        <Fragment>
          {filters[FilterColumns.ASSIGNEE]!.map((user) => (
            <div className="tag tag-blue" key={user}>
              <FormattedMessage {...sharedMessages[FilterColumns.ASSIGNEE]} />:{' '}
              {getUserFullname(allResults.userlites[user])}
              <button
                onClick={() =>
                  setFilters((existingFilters) => ({
                    ...existingFilters,
                    [FilterColumns.ASSIGNEE]:
                      existingFilters[FilterColumns.ASSIGNEE]!.length === 1
                        ? undefined
                        : existingFilters[FilterColumns.ASSIGNEE]!.filter(
                            (selectedUser) => selectedUser !== user,
                          ),
                  }))
                }
                aria-labelledby={seed(`${FilterColumns.ASSIGNEE} - ${user}}`)}
              >
                <svg role="img" className="w-5 h-5 -mr-2 fill-current">
                  <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
                  <title
                    id={seed(
                      `${FilterColumns.ASSIGNEE} - ${getUserFullname(
                        allResults.userlites[user],
                      )}`,
                    )}
                  >
                    <FormattedMessage {...messages.removeFilter} />
                  </title>
                </svg>
              </button>
            </div>
          ))}
        </Fragment>
      ) : null}
      {filters[FilterColumns.USER] ? (
        <Fragment>
          {filters[FilterColumns.USER]!.map((user) => (
            <div className="tag tag-blue" key={user}>
              <FormattedMessage {...sharedMessages[FilterColumns.USER]} />:{' '}
              {getUserFullname(allResults.userlites[user])}
              <button
                onClick={() =>
                  setFilters((existingFilters) => ({
                    ...existingFilters,
                    [FilterColumns.USER]:
                      existingFilters[FilterColumns.USER]!.length === 1
                        ? undefined
                        : existingFilters[FilterColumns.USER]!.filter(
                            (selectedUser) => selectedUser !== user,
                          ),
                  }))
                }
                aria-labelledby={seed(`${FilterColumns.USER} - ${user}}`)}
              >
                <svg role="img" className="w-5 h-5 -mr-2 fill-current">
                  <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
                  <title
                    id={seed(
                      `${FilterColumns.USER} - ${getUserFullname(
                        allResults.userlites[user],
                      )}`,
                    )}
                  >
                    <FormattedMessage {...messages.removeFilter} />
                  </title>
                </svg>
              </button>
            </div>
          ))}
        </Fragment>
      ) : null}
      {filters[FilterColumns.UNIT] ? (
        <Fragment>
          {filters[FilterColumns.UNIT]!.map((unit) => (
            <div className="tag tag-blue" key={unit}>
              <FormattedMessage {...sharedMessages[FilterColumns.UNIT]} />:{' '}
              {allResults.unitlites[unit].name}
              <button
                onClick={() =>
                  setFilters((existingFilters) => ({
                    ...existingFilters,
                    [FilterColumns.UNIT]:
                      existingFilters[FilterColumns.UNIT]!.length === 1
                        ? undefined
                        : existingFilters[FilterColumns.UNIT]!.filter(
                            (selectedUnit) => selectedUnit !== unit,
                          ),
                  }))
                }
                aria-labelledby={seed(`${FilterColumns.UNIT} - ${unit}}`)}
              >
                <svg role="img" className="w-5 h-5 -mr-2 fill-current">
                  <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
                  <title
                    id={seed(
                      `${FilterColumns.UNIT} - ${allResults.unitlites[unit].name}`,
                    )}
                  >
                    <FormattedMessage {...messages.removeFilter} />
                  </title>
                </svg>
              </button>
            </div>
          ))}
        </Fragment>
      ) : null}
      {filters[FilterColumns.TOPIC] ? (
        <Fragment>
          {filters[FilterColumns.TOPIC]!.map((topic) => (
            <div className="tag tag-blue" key={topic}>
              <FormattedMessage {...sharedMessages[FilterColumns.TOPIC]} />:{' '}
              {allResults.topiclites[topic].name}
              <button
                onClick={() =>
                  setFilters((existingFilters) => ({
                    ...existingFilters,
                    [FilterColumns.TOPIC]:
                      existingFilters[FilterColumns.TOPIC]!.length === 1
                        ? undefined
                        : existingFilters[FilterColumns.TOPIC]!.filter(
                            (selectedTopic) => selectedTopic !== topic,
                          ),
                  }))
                }
                aria-labelledby={seed(`${FilterColumns.TOPIC} - ${topic}}`)}
              >
                <svg role="img" className="w-5 h-5 -mr-2 fill-current">
                  <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
                  <title
                    id={seed(
                      `${FilterColumns.TOPIC} - ${allResults.topiclites[topic].name}`,
                    )}
                  >
                    <FormattedMessage {...messages.removeFilter} />
                  </title>
                </svg>
              </button>
            </div>
          ))}
        </Fragment>
      ) : null}
    </div>
  );
};
