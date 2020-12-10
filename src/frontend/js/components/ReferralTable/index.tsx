import React from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';

import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { Referral } from 'types';
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
  referrals: Referral[];
}

export const ReferralTable: React.FC<ReferralTableProps> = ({ referrals }) => {
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
                index % 2 === 0 ? 'bg-white' : 'bg-gray-200'
              }`}
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
                <a
                  className="stretched-link"
                  href={`/unit/${referral.topic.unit.id}/referral-detail/${referral.id}/`}
                >
                  {referral.object}
                </a>
              </th>
              <td>
                <div>{referral.requester}</div>
                <div className="text-gray-600">{referral.user.unit_name}</div>
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
