import React, { useState } from 'react';
import { FormattedDate, defineMessages, FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { ReferralLite } from 'types';
import { getUserShortname } from 'utils/user';
import { useCurrentUser } from '../../data/useCurrentUser';
import { SubscribeButton } from '../buttons/SubscribeButton';
import { SubscribeModal } from '../modals/SubscribeModal';
import { useDeleteAction } from 'data';
import { Spinner } from 'components/Spinner';

const messages = defineMessages({
  deleteDraftReferral: {
    defaultMessage: 'Delete',
    description: 'Title for the delete button, in the user referral table.',
    id: 'components.USerReferralTableRow.DeleteDraftReferral',
  },
});

interface ReferralTableRowProps {
  index: number;
  getReferralUrl: (referral: ReferralLite) => string;
  referral: ReferralLite;
  onAction: Function;
  onDelete: Function;
  task: string;
}

export const UserReferralTableRow: React.FC<ReferralTableRowProps> = ({
  index,
  getReferralUrl,
  referral,
  onAction,
  onDelete,
  task,
}) => {
  const history = useHistory();
  const { currentUser } = useCurrentUser();
  const [showModal, setShowModal] = useState(false);
  const deleteMutation = useDeleteAction();
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

          {task == 'my_drafts' ? (
            <td>
              <div className="flex relative justify-start">
                <button
                  className="z-10 btn btn-primary-outline flex items-center space-x-2 mx-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(
                      {
                        name: 'referrals',
                        referral: referral,
                      },
                      {
                        onSuccess: () => {
                          onDelete(index);
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
                        <FormattedMessage {...messages.deleteDraftReferral} />
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
                      <FormattedMessage {...messages.deleteDraftReferral} />
                    </span>
                  )}
                </button>
              </div>
            </td>
          ) : null}
        </tr>
      )}
    </>
  );
};
