import React, { Fragment, PropsWithChildren, useState } from 'react';
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
import { ReferralState } from 'types';
import { useDeleteAction } from 'data';

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
  createdAt: {
    defaultMessage: 'Created date',
    description:
      'Title for the table column for created at in the referral table.',
    id: 'components.ReferralTable.createdAt',
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
  PublishedDate: {
    defaultMessage: 'PublishedDate',
    description:
      'Title for the table column for statuses in the referral table.',
    id: 'components.ReferralTable.PublishedDate',
  },
  deleteDraftReferral: {
    defaultMessage: 'Delete',
    description: 'Title for the delete button, in the referral table.',
    id: 'components.ReferralTable.DeleteDraftReferral',
  },
});

type SortingKey =
  | 'case_number'
  | 'due_date'
  | 'created_at'
  | 'object.keyword'
  | 'users_unit_name_sorting'
  | 'assignees_sorting'
  | 'state_number'
  | 'published_date';

type SortingDirection = 'asc' | 'desc';
type SortingDict = { sort: SortingKey; sort_dir: SortingDirection };

const SortingButton: React.FC<{
  sortingKey: SortingKey;
  setSorting: React.Dispatch<React.SetStateAction<SortingDict>>;
  sorting: SortingDict;
}> = ({ children, setSorting, sorting, sortingKey }) => (
  <button
    className={`flex flex-row items-center gap-1 font-semibold whitespace-nowrap ${
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
      role="presentation"
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
  hideColumns?: string[];
  caption: string;
  emptyState?: JSX.Element;
  getReferralUrl: (referral: ReferralLite) => string;
  disableFilters?: boolean;
}

const TableTh = ({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) => {
  return (
    <th scope="col" className={`p-3 text-sm ${className}`}>
      {children}
    </th>
  );
};
export const ReferralTable: React.FC<ReferralTableProps> = ({
  defaultParams = {},
  disabledColumns,
  hideColumns,
  caption,
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
    sort: 'created_at',
    sort_dir: 'desc',
  });

  const { data, status } = useReferralLites(
    {
      ...defaultParams,
      ...filters,
      ...sorting,
    },
    {
      onSuccess: (data) => {
        setReferrals(data);
      },
    },
  );
  const [referrals, setReferrals] = useState(data);

  const deleteMutation = useDeleteAction();

  const updateReferrals = (index: number) => {
    setReferrals((prevState: any) => {
      prevState.results.splice(index, 1);
      return { ...prevState };
    });
  };

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
      ) : referrals!.count > 0 ? (
        <div className="inline-block">
          <table className="min-w-full border-2 border-gray-200 rounded-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="border-b-2 border-gray-200">
              <tr>
                <TableTh>
                  <SortingButton
                    sortingKey="case_number"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    #
                  </SortingButton>
                </TableTh>
                <TableTh>
                  <SortingButton
                    sortingKey="created_at"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.createdAt} />
                  </SortingButton>
                </TableTh>
                <TableTh>
                  <SortingButton
                    sortingKey="due_date"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.dueDate} />
                  </SortingButton>
                </TableTh>
                <TableTh className="min-w-272 max-w-304">
                  <SortingButton
                    sortingKey="object.keyword"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.object} />
                  </SortingButton>
                </TableTh>
                <TableTh>
                  <SortingButton
                    sortingKey="users_unit_name_sorting"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.requesters} />
                  </SortingButton>
                </TableTh>
                <TableTh>
                  <SortingButton
                    sortingKey="assignees_sorting"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.assignment} />
                  </SortingButton>
                </TableTh>
                <TableTh>
                  <SortingButton
                    sortingKey="state_number"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.status} />
                  </SortingButton>
                </TableTh>
                {!hideColumns?.includes('PUBLISHED_DATE') ? (
                  <TableTh>
                    <SortingButton
                      sortingKey="published_date"
                      setSorting={setSorting}
                      sorting={sorting}
                    >
                      <FormattedMessage {...messages.PublishedDate} />
                    </SortingButton>
                  </TableTh>
                ) : null}
                {defaultParams?.state?.includes(ReferralState.DRAFT) ? (
                  <th></th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {referrals!.results.map((referral, index) => (
                <tr
                  key={referral.id}
                  className={`stretched-link-container cursor-pointer hover:bg-gray-300 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                  }`}
                  onClick={() => {
                    // Link stretching does not work in Safari. JS has to take over to make rows clickable.
                    history.push(getReferralUrl(referral));
                  }}
                >
                  <td className="text-sm p-2">
                    <span className="text-sm">{referral.id}</span>
                  </td>
                  <td className="text-sm p-2">
                    <div
                      className="flex items-center"
                      style={{ minHeight: '3rem' }}
                    >
                      <FormattedDate
                        year="numeric"
                        month="numeric"
                        day="numeric"
                        value={referral.created_at}
                      />
                    </div>
                  </td>
                  <td className="text-sm p-2">
                    <div
                      className="flex items-center text-sm"
                      style={{ minHeight: '3rem' }}
                    >
                      {referral.due_date !== null ? (
                        <FormattedDate
                          year="numeric"
                          month="numeric"
                          day="numeric"
                          value={referral.due_date}
                        />
                      ) : null}
                    </div>
                  </td>
                  <td scope="row" className="text-sm p-2 min-w-272 max-w-320">
                    <Link
                      className="stretched-link"
                      to={getReferralUrl(referral)}
                      onClick={(e) => e.preventDefault()}
                    >
                      {referral.title || referral.object}
                    </Link>
                  </td>
                  <td className="text-sm p-2">
                    {referral.users
                      .map((user) => user.unit_name)
                      .sort()
                      .join(', ')}
                  </td>
                  <td className="text-sm p-2">
                    {referral.assignees
                      .map((assignee) => getUserFullname(assignee))
                      .sort()
                      .join(', ')}
                  </td>
                  <td className="text-sm p-2">
                    <ReferralStatusBadge status={referral.state} />
                  </td>
                  {!hideColumns?.includes('PUBLISHED_DATE') ? (
                    <td className="text-sm p-2">
                      {referral.published_date !== null ? (
                        <FormattedDate
                          year="numeric"
                          month="long"
                          day="numeric"
                          value={referral.published_date}
                        />
                      ) : null}
                    </td>
                  ) : null}
                  {defaultParams?.state?.includes(ReferralState.DRAFT) ? (
                    <td className="text-sm p-2">
                      <div className="flex relative justify-start">
                        <button
                          className="z-10 btn btn-primary-outline flex items-center space-x-2 mx-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(
                              {
                                name: 'referrals',
                                id: String(referral.id),
                              },
                              {
                                onSuccess: () => {
                                  updateReferrals(index);
                                },
                              },
                            );
                          }}
                          aria-busy={deleteMutation.isLoading}
                          aria-disabled={deleteMutation.isLoading}
                        >
                          {deleteMutation.isLoading ? (
                            <span aria-hidden="true">
                              <span className="opacity-0">
                                <FormattedMessage
                                  {...messages.deleteDraftReferral}
                                />
                              </span>
                              <Spinner
                                size="small"
                                color="white"
                                className="absolute inset-0"
                              >
                                {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
                              </Spinner>
                            </span>
                          ) : (
                            <span>
                              <FormattedMessage
                                {...messages.deleteDraftReferral}
                              />
                            </span>
                          )}
                        </button>
                      </div>
                    </td>
                  ) : null}
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
