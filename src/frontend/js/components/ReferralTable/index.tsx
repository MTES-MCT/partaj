import React, { Fragment, useState } from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { Link, useHistory } from 'react-router-dom';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { Spinner } from 'components/Spinner';
import { useReferralLites, UseReferralLitesParams } from 'data';
import { ReferralLite } from 'types';
import { getUserFullname } from 'utils/user';
import { Filters, FilterColumns, FiltersDict } from './Filters';
import { configureScope } from '@sentry/react';

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
    defaultMessage: 'Requesters',
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

const processFiltersDict = (filtersDict: FiltersDict) => {
  const processedFilters: UseReferralLitesParams = {};

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

  if (filtersDict[FilterColumns.USER]) {
    processedFilters.user = filtersDict[FilterColumns.USER]!.map(
      (user) => user.id,
    );
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

interface ReferralTableProps {
  defaultParams?: UseReferralLitesParams;
  disabledColumns?: FilterColumns[];
  emptyState?: JSX.Element;
  getReferralUrl: (referral: ReferralLite) => string;
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
}) => {
  const history = useHistory();

  const [filters, setFilters] = useState<FiltersDict>({});

  const { data, status } = useReferralLites({
    ...defaultParams,
    ...processFiltersDict(filters),
  });

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size="large">
          <FormattedMessage {...messages.loading} />
        </Spinner>
      );

    case 'success':
      return (
        <Fragment>
          <Filters {...{ disabledColumns, filters, setFilters }} />
          {data!.count > 0 ? (
            <div
              className="border-2 border-gray-200 rounded-sm inline-block"
              style={{ width: '60rem' }}
            >
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th scope="col" className="p-3">
                      #
                    </th>
                    <th scope="col" className="p-3">
                      <FormattedMessage {...messages.dueDate} />
                    </th>
                    <th scope="col" className="p-3">
                      <FormattedMessage {...messages.object} />
                    </th>
                    <th scope="col" className="p-3">
                      <FormattedMessage {...messages.requesters} />
                    </th>
                    <th scope="col" className="p-3">
                      <FormattedMessage {...messages.assignment} />
                    </th>
                    <th scope="col" className="p-3">
                      <FormattedMessage {...messages.status} />
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
                          .map((userLite) => getUserFullname(userLite))
                          .join(', ')}
                      </td>
                      <td>
                        {referral.assignees.map((assignee) => (
                          <div key={assignee.id}>
                            {getUserFullname(assignee)}
                          </div>
                        ))}
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
  }
};
