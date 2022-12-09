import React, { Fragment, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { appData } from 'appData';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { UseReferralLitesParams, useUserReferralLites } from 'data';
import { IconColor, ReferralLite } from 'types';
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
  subscription: {
    defaultMessage: 'Subscription',
    description:
      'Title for the table column for subscriptions in the referral table.',
    id: 'components.UserReferralTable.subscription',
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
  color?: IconColor;
}> = ({ children, setSorting, sorting, sortingKey, color }) => (
  <button
    className={`flex flex-row whitespace-no-wrap items-center gap-1 ${
      sorting.sort === sortingKey ? 'font-medium ' : ''
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
      className={`fill-${color ?? 'current'} block w-3 h-3 transform ${
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

  const deleteReferrals = (index: number) => {
    setReferrals((prevState: any) => {
      prevState.results.splice(index, 1);
      return { ...prevState };
    });
  };

  return (
    <Fragment>
      {status === 'error' ? (
        <GenericErrorMessage />
      ) : status === 'idle' || status === 'loading' ? (
        <Spinner size="large">
          <FormattedMessage {...messages.loading} />
        </Spinner>
      ) : referrals!.count > 0 ? (
        <div className="inline-block">
          <table className="min-w-full">
            <thead className="rounded-t bg-primary-1000 text-white">
              <tr>
                <th scope="col" className="p-3 text-white">
                  <div className="flex flex-grow bg-primary-1000 rounded">
                    <SortingButton
                      sortingKey="case_number"
                      setSorting={setSorting}
                      sorting={sorting}
                      color="white"
                    >
                      #
                    </SortingButton>
                  </div>
                </th>
                <th scope="col" className="p-3 text-white">
                  <SortingButton
                    sortingKey="due_date"
                    setSorting={setSorting}
                    sorting={sorting}
                    color="white"
                  >
                    <FormattedMessage {...messages.dueDate} />
                  </SortingButton>
                </th>
                <th scope="col" className="p-3 text-white">
                  <SortingButton
                    sortingKey="object.keyword"
                    setSorting={setSorting}
                    sorting={sorting}
                    color="white"
                  >
                    <FormattedMessage {...messages.object} />
                  </SortingButton>
                </th>
                <th scope="col" className="p-3 text-white">
                  <SortingButton
                    sortingKey="users_unit_name_sorting"
                    setSorting={setSorting}
                    sorting={sorting}
                    color="white"
                  >
                    <FormattedMessage {...messages.requesters} />
                  </SortingButton>
                </th>
                <th scope="col" className="p-3 text-white">
                  <SortingButton
                    sortingKey="assignees_sorting"
                    setSorting={setSorting}
                    sorting={sorting}
                    color="white"
                  >
                    <FormattedMessage {...messages.assignment} />
                  </SortingButton>
                </th>
                <th scope="col" className="p-3 text-white">
                  <SortingButton
                    sortingKey="state_number"
                    setSorting={setSorting}
                    sorting={sorting}
                    color="white"
                  >
                    <FormattedMessage {...messages.status} />
                  </SortingButton>
                </th>
                <th scope="col" className="p-3 text-white">
                  <SortingButton
                    sortingKey="published_date"
                    setSorting={setSorting}
                    sorting={sorting}
                    color="white"
                  >
                    <FormattedMessage {...messages.PublishedDate} />
                  </SortingButton>
                </th>
                <th scope="col" className="p-3 text-white font-normal">
                  <FormattedMessage {...messages.subscription} />
                </th>
                {defaultParams?.task == 'my_drafts' ? <th></th> : null}
              </tr>
            </thead>
            <tbody className="text-primary-1000">
              {referrals &&
                referrals!.results.map((referral, index) => (
                  <UserReferralTableRow
                    key={referral.id}
                    index={index}
                    referral={referral}
                    getReferralUrl={getReferralUrl}
                    onAction={(data: ReferralLite) =>
                      updateReferrals(index, data)
                    }
                    task={defaultParams.task!}
                    onDelete={(data: ReferralLite) => deleteReferrals(index)}
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
