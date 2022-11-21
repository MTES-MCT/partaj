import React, { Fragment, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { appData } from 'appData';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import {
  UseReferralLitesParams,
  useUserReferralLites,
} from 'data';
import { ReferralLite } from 'types';
import { UserReferralTableRow } from './UserReferralTableRow';

const messages = defineMessages({
  assignment: {
    defaultMessage: 'Assignment(s)',
    description:
      'Title for the table column for assignments in the referral table.',
    id: 'components.UserReferralTable.assignment',
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
    id: 'components.UserReferralTable.dueDate',
  },
  loading: {
    defaultMessage: 'Loading referrals...',
    description:
      'Accessible message for the spinner while loading referrals in the referral table.',
    id: 'components.UserReferralTable.loading',
  },
  object: {
    defaultMessage: 'Object',
    description:
      'Title for the table column for objects in the referral table.',
    id: 'components.UserReferralTable.object',
  },
  requesters: {
    defaultMessage: "Requesters' Unit(s) ",
    description:
      'Title for the table column for requesters in the referral table.',
    id: 'components.UserReferralTable.requesters',
  },
  status: {
    defaultMessage: 'Status',
    description:
      'Title for the table column for statuses in the referral table.',
    id: 'components.UserReferralTable.status',
  },
  PublishedDate: {
    defaultMessage: 'PublishedDate',
    description:
      'Title for the table column for statuses in the referral table.',
    id: 'components.UserReferralTable.PublishedDate',
  },
});

type SortingKey =
  | 'case_number'
  | 'due_date'
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
  hideColumns?: string[];
  emptyState?: JSX.Element;
  getReferralUrl: (referral: ReferralLite) => string;
}

export const UserReferralTable: React.FC<ReferralTableProps> = ({
  defaultParams = {},
  emptyState = (
    <div>
      <FormattedMessage {...messages.defaultEmptyMessage} />
    </div>
  ),
  getReferralUrl,
}) => {
  const [sorting, setSorting] = useState<SortingDict>({
    sort: 'due_date',
    sort_dir: 'desc',
  });

  const { data, status } = useUserReferralLites(
    {
      ...defaultParams,
      ...sorting,
    },
    {
      onSuccess: (data) => {
        setReferrals(data);
      },
    },
  );

  const [referrals, setReferrals] = useState(data);
  const updateReferrals = (index: number, data: ReferralLite) => {
    setReferrals((prevState: any) => {
      prevState.results[index] = data;

      return { ...prevState };
    });
  };

  useEffect(() => {
    console.log('NEW REFERRALS HERE');
  }, [referrals]);

  return (
    <Fragment>
      {status === 'error' ? (
        <GenericErrorMessage />
      ) : status === 'idle' || status === 'loading' ? (
        <Spinner size="large">
          <FormattedMessage {...messages.loading} />
        </Spinner>
      ) : referrals!.count > 0 ? (
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
                <th scope="col" className="p-3">
                  <SortingButton
                    sortingKey="published_date"
                    setSorting={setSorting}
                    sorting={sorting}
                  >
                    <FormattedMessage {...messages.PublishedDate} />
                  </SortingButton>
                </th>
                <th scope="col" className="p-3">
                  Rôle
                </th>
              </tr>
            </thead>
            <tbody>
              {referrals &&
                referrals!.results.map((referral, index) => (
                  <UserReferralTableRow
                    key={referral.id}
                    index={index}
                    referral={referral}
                    getReferralUrl={getReferralUrl}
                    onAction={ (data: ReferralLite) => updateReferrals(index, data)}
                  />
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        emptyState
      )}
    </Fragment>
  );
};
