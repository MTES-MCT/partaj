import React, { Fragment, useState } from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { Link, useHistory } from 'react-router-dom';

import { appData } from 'appData';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { Spinner } from 'components/Spinner';
import { useReferralLites, UseReferralLitesParams } from 'data';
import { ReferralLite } from 'types';
import { getUserFullname } from 'utils/user';
import { Filters } from './Filters';
import { FilterColumns, FiltersDict } from './types';

const messages = defineMessages({
  assignment: {
    defaultMessage: 'Assignment(s)',
    description:
      'Title for the table column for assignments in the referral table.',
    id: 'components.ReferralTable.assignment',
  },
  defaultEmptyMessage: {
    defaultMessage: 'There are not referrals to show.',
    description: 'Default empty table message for the referral table.',
    id: 'components.ReferralTable.defaultEmptyMessage',
  },
  dueDate: {
    defaultMessage: 'Due date',
    description:
      'Title for the table column for due dates in the referral table.',
    id: 'components.ReferralTable.dueDate',
  },
  emptyStateWithFilters: {
    defaultMessage:
      'There are no referrals matching the current set of filters.',
    description:
      'Empty table message shown when there are no referrals and there are active filters.',
    id: 'components.ReferralTable.emptyStateWithFilters',
  },
  loading: {
    defaultMessage: 'Loading referrals...',
    description:
      'Accessible message for the spinner while loading referrals in the referral table.',
    id: 'components.ReferralTable.loading',
  },
  object: {
    defaultMessage: 'Object',
    description:
      'Title for the table column for objects in the referral table.',
    id: 'components.ReferralTable.object',
  },
  requesters: {
    defaultMessage: "Requesters' Unit(s) ",
    description:
      'Title for the table column for requesters in the referral table.',
    id: 'components.ReferralTable.requesters',
  },
  status: {
    defaultMessage: 'Status',
    description:
      'Title for the table column for statuses in the referral table.',
    id: 'components.ReferralTable.status',
  },
});

type SortingKey =
  | 'case_number'
  | 'due_date'
  | 'object.keyword'
  | 'users_unit_name_sorting'
  | 'assignees_sorting'
  | 'state_number';
type SortingDirection = 'asc' | 'desc';
type SortingDict = { sort: SortingKey; sort_dir: SortingDirection };

const processFiltersDict = (filtersDict: FiltersDict) => {
  const processedFilters: UseReferralLitesParams = {
    query: filtersDict.query || undefined,
  };

  if (filtersDict[FilterColumns.ASSIGNEE]) {
    processedFilters.assignee = filtersDict[FilterColumns.ASSIGNEE]!.map(
      (user) => user.id,
    );
  }

  if (filtersDict[FilterColumns.STATE]) {
    processedFilters.state = filtersDict[FilterColumns.STATE];
  }

  if (filtersDict[FilterColumns.UNIT]) {
    processedFilters.unit = filtersDict[FilterColumns.UNIT]!.map(
      (unit) => unit.id,
    );
  }
  if (filtersDict[FilterColumns.TOPIC]) {
    processedFilters.topic = filtersDict[FilterColumns.TOPIC]!.map(
      (topic) => topic.id,
    );
  }
  if (filtersDict[FilterColumns.USER_UNIT_NAME]) {
    processedFilters.users_unit_name = filtersDict[
      FilterColumns.USER_UNIT_NAME
    ]!.map((user) => user.unit_name);
  }

  if (filtersDict[FilterColumns.DUE_DATE]) {
    processedFilters.due_date_after = filtersDict[
      FilterColumns.DUE_DATE
    ]!.due_date_after.toISOString().substring(0, 10);
    processedFilters.due_date_before = filtersDict[
      FilterColumns.DUE_DATE
    ]!.due_date_before.toISOString().substring(0, 10);
  }

  return processedFilters;
};

const SortingButton: React.FC<{
  sortingKey: SortingKey;
  setSorting: React.Dispatch<React.SetStateAction<SortingDict>>;
  sorting: SortingDict;
}> = ({ children, setSorting, sorting, sortingKey }) => (
  <button
    className={`flex flex-row items-center gap-1 font-semibold ${
      sorting.sort === sortingKey ? 'text-primary-500' : ''
    }`}
    onClick={() => {
      setSorting(
        ({ sort, sort_dir }: SortingDict): SortingDict => ({
          sort: sortingKey,
          sort_dir:
            sort !== sortingKey ? 'desc' : sort_dir === 'desc' ? 'asc' : 'desc',
        }),
      );
    }}
  >
    {children}
    <svg
      role="img"
      className={`fill-current block w-3 h-3 transform ${
        sorting.sort === sortingKey && sorting.sort_dir === 'asc'
          ? 'rotate-180'
          : ''
      }`}
    >
      <use xlinkHref={`${appData.assets.icons}#icon-chevron-thin-down`} />
    </svg>
  </button>
);

interface ReferralTableProps {
  defaultParams?: UseReferralLitesParams;
  disabledColumns?: FilterColumns[];
  emptyState?: JSX.Element;
  getReferralUrl: (referral: ReferralLite) => string;
  disableFilters?: boolean;
}

export const ReferralTable: React.FC<ReferralTableProps> = ({
  defaultParams = {},
  disabledColumns,
  emptyState = (
    <div>
      <FormattedMessage {...messages.defaultEmptyMessage} />
    </div>
  ),
  getReferralUrl,
  disableFilters,
}) => {
  const history = useHistory();

  const [filters, setFilters] = useState<FiltersDict>({});
  const [sorting, setSorting] = useState<SortingDict>({
    sort: 'due_date',
    sort_dir: 'desc',
  });

  const { data, status } = useReferralLites({
    ...defaultParams,
    ...processFiltersDict(filters),
    ...sorting,
  });

  return (
    <Fragment>
      {!disableFilters ? (
        <Filters {...{ disabledColumns, filters, setFilters }} />
      ) : null}

      {status === 'error' ? (
        <GenericErrorMessage />
      ) : status === 'idle' || status === 'loading' ? (
        <Spinner size="large">
          <FormattedMessage {...messages.loading} />
        </Spinner>
      ) : data!.count > 0 ? (
        <div
          className="border-2 border-gray-200 rounded-sm inline-block"
          style={{ width: '60rem' }}
        >
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th scope="col" className="p-3">
                  <SortingButton
                    sortingKey="case_number"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    #
                  </SortingButton>
                </th>
                <th scope="col" className="p-3">
                  <SortingButton
                    sortingKey="due_date"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.dueDate} />
                  </SortingButton>
                </th>
                <th scope="col" className="p-3">
                  <SortingButton
                    sortingKey="object.keyword"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.object} />
                  </SortingButton>
                </th>
                <th scope="col" className="p-3">
                  <SortingButton
                    sortingKey="users_unit_name_sorting"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.requesters} />
                  </SortingButton>
                </th>
                <th scope="col" className="p-3">
                  <SortingButton
                    sortingKey="assignees_sorting"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.assignment} />
                  </SortingButton>
                </th>
                <th scope="col" className="p-3">
                  <SortingButton
                    sortingKey="state_number"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.status} />
                  </SortingButton>
                </th>
              </tr>
            </thead>
            <tbody>
              {data!.results.map((referral, index) => (
                <tr
                  key={referral.id}
                  className={`stretched-link-container cursor-pointer hover:bg-gray-300 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                  }`}
                  onClick={() =>
                    // Link stretching does not work in Safari. JS has to take over to make rows clickable.
                    history.push(getReferralUrl(referral))
                  }
                >
                  <td>{referral.id}</td>
                  <td>
                    <div
                      className="flex items-center"
                      style={{ minHeight: '3rem' }}
                    >
                      {referral.due_date !== null ? (
                        <FormattedDate
                          year="numeric"
                          month="long"
                          day="numeric"
                          value={referral.due_date}
                        />
                      ) : null}
                    </div>
                  </td>
                  <th scope="row" className="font-normal">
                    <Link
                      className="stretched-link"
                      to={getReferralUrl(referral)}
                      onClick={(e) => e.preventDefault()}
                    >
                      {referral.object}
                    </Link>
                  </th>
                  <td>
                    {referral.users
                      .map((user) => user.unit_name)
                      .sort()
                      .join(', ')}
                  </td>
                  <td>
                    {referral.assignees
                      .map((assignee) => getUserFullname(assignee))
                      .sort()
                      .join(', ')}
                  </td>
                  <td>
                    <ReferralStatusBadge status={referral.state} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : Object.values(filters).find((value) => !!value) ? (
        <FormattedMessage {...messages.emptyStateWithFilters} />
      ) : (
        emptyState
      )}
    </Fragment>
  );
};
