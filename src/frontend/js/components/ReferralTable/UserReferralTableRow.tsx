import React, { useState } from 'react';
import { FormattedDate } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { ReferralLite } from 'types';
import { getUserShortname } from 'utils/user';
import { useCurrentUser } from '../../data/useCurrentUser';
import { SubscribeButton } from '../buttons/SubscribeButton';
import { SubscribeModal } from '../modals/SubscribeModal';

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
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {referral && (
        <tr
          key={referral.id}
          className={`cursor-pointer hover:bg-purple-200 ${
            index % 2 === 0 ? 'bg-white' : 'bg-purple-100'
          }`}
          onClick={(e) => {
            history.push(getReferralUrl(referral));
          }}
        >
          <td>{referral.id}</td>
          <td>
            <div className="flex items-center">
              {referral.due_date !== null ? (
                <FormattedDate value={referral.due_date} />
              ) : null}
            </div>
          </td>
          <td className="object-td">{referral.object}</td>
          <td className="text-sm">
            {referral.users.map((user) => <p>{user.unit_name}</p>).sort()}
          </td>
          <td>
            {referral.assignees
              .map((assignee) => <p>{getUserShortname(assignee)}</p>)
              .sort()}
          </td>
          <td>
            <ReferralStatusBadge status={referral.state} />
          </td>
          <td>
            {referral.published_date !== null ? (
              <FormattedDate value={referral.published_date} />
            ) : null}
          </td>
          <td>
            <div className="flex relative justify-start">
              <SubscribeButton
                user={currentUser}
                referral={referral}
                setShowModal={setShowModal}
                onClick={() => setShowModal(true)}
              />
              <SubscribeModal
                setShowModal={setShowModal}
                showModal={showModal}
                user={currentUser}
                referral={referral}
                onSuccess={(data: any) => onAction(data)}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
