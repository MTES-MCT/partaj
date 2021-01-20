import React from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { Link, useHistory } from 'react-router-dom';

import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { ReferralLite } from 'types';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  assignment: {
    defaultMessage: 'Assignment(s)',
    description:
      'Title for the table column for assignments in the referral table.',
    id: 'components.ReferralTable.assignment',
  },
  dueDate: {
    defaultMessage: 'Due date',
    description:
      'Title for the table column for due dates in the referral table.',
    id: 'components.ReferralTable.dueDate',
  },
  object: {
    defaultMessage: 'Object',
    description:
      'Title for the table column for objects in the referral table.',
    id: 'components.ReferralTable.object',
  },
  requester: {
    defaultMessage: 'Requester',
    description:
      'Title for the table column for requesters in the referral table.',
    id: 'components.ReferralTable.requester',
  },
  status: {
    defaultMessage: 'Status',
    description:
      'Title for the table column for statuses in the referral table.',
    id: 'components.ReferralTable.status',
  },
});

interface ReferralTableProps {
  getReferralUrl: (referral: ReferralLite) => string;
  referrals: ReferralLite[];
}

export const ReferralTable: React.FC<ReferralTableProps> = ({
  getReferralUrl,
  referrals,
}) => {
  const history = useHistory();

  return (
    <div
      className="border-2 border-gray-200 rounded-sm inline-block"
      style={{ width: '60rem' }}
    >
      <table className="min-w-full">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th scope="col" className="p-3">
              <FormattedMessage {...messages.dueDate} />
            </th>
            <th scope="col" className="p-3">
              <FormattedMessage {...messages.object} />
            </th>
            <th scope="col" className="p-3">
              <FormattedMessage {...messages.requester} />
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
          {referrals.map((referral, index) => (
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
              <td>
                <div
                  className="flex items-center"
                  style={{ minHeight: '3rem' }}
                >
                  <FormattedDate
                    year="numeric"
                    month="long"
                    day="numeric"
                    value={referral.due_date}
                  />
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
                <div>{referral.requester}</div>
                <div className="text-gray-500">
                  {referral.requester_unit_name}
                </div>
              </td>
              <td>
                {referral.assignees.map((assignee) => (
                  <div>{getUserFullname(assignee)}</div>
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
  );
};
