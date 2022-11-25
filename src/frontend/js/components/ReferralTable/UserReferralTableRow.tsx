import React from 'react';
import { FormattedDate } from 'react-intl';
import { Link, useHistory } from 'react-router-dom';

import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { ReferralLite } from 'types';
import { getUserFullname } from 'utils/user';
import { useCurrentUser } from '../../data/useCurrentUser';
import { RequesterButton } from '../buttons/RequesterButton';
import { ObserverButton } from '../buttons/ObserverButton';

interface ReferralTableRowProps {
  index: number;
  getReferralUrl: (referral: ReferralLite) => string;
  referral: ReferralLite;
  onAction: Function;
}

export const UserReferralTableRow: React.FC<ReferralTableRowProps> = ({
  index,
  getReferralUrl,
  referral,
  onAction,
}) => {
  const history = useHistory();
  const { currentUser } = useCurrentUser();

  return (
    <>
      {referral && (
        <tr
          key={referral.id}
          className={`cursor-pointer hover:bg-gray-200 ${
            index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
          }`}
          onClick={(e) => {
            history.push(getReferralUrl(referral));
          }}
        >
          <td>{referral.id}</td>
          <td>
            <div className="flex items-center" style={{ minHeight: '3rem' }}>
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
            {referral.object}
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
          <td>
            {referral.published_date !== null ? (
              <FormattedDate
                year="numeric"
                month="long"
                day="numeric"
                value={referral.published_date}
              />
            ) : null}
          </td>
          <td>
            <div className="flex relative">
              <ObserverButton
                user={currentUser}
                referral={referral}
                onClick={(data: any) => onAction(data)}
              />
              <RequesterButton
                user={currentUser}
                referral={referral}
                onClick={(data: any) => onAction(data)}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
