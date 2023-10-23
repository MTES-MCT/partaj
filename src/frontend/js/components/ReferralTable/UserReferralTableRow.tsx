import React, { useState } from 'react';
import { FormattedDate, defineMessages, FormattedMessage } from 'react-intl';
import { Link, useHistory } from 'react-router-dom';
import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { ReferralLite, TaskParams } from 'types';
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
    id: 'components.UserReferralTableRow.deleteDraftReferral',
  },
});

interface ReferralTableRowProps {
  index: number;
  getReferralUrl: (referral: ReferralLite) => string;
  referral: ReferralLite;
  onDelete: Function;
  task: string;
}

export const UserReferralTableRow: React.FC<ReferralTableRowProps> = ({
  index,
  getReferralUrl,
  referral,
  onDelete,
  task,
}) => {
  const history = useHistory();
  const { currentUser } = useCurrentUser();
  const deleteMutation = useDeleteAction();
  return (
    <>
      {referral && (
        <tr
          key={referral.id}
          className={`cursor-pointer hover:bg-purple-200 stretched-link-container ${
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
          <td className="object-td">
            <Link
              className="stretched-link"
              to={getReferralUrl(referral)}
              onClick={(e) => e.preventDefault()}
            >
              {referral.object}
            </Link>
          </td>
          <td className="text-sm">
            {referral.users.map((user) => <p>{user.unit_name}</p>).sort()}
          </td>
          {task != TaskParams.MY_DRAFTS ? (
            <td>
              {referral.assignees
                .map((assignee) => <p>{getUserShortname(assignee)}</p>)
                .sort()}
            </td>
          ) : null}
          <td>
            <ReferralStatusBadge status={referral.state} />
          </td>
          {task != TaskParams.MY_DRAFTS ? (
            <>
              <td>
                {referral.published_date !== null ? (
                  <FormattedDate value={referral.published_date} />
                ) : null}
              </td>
              <td>
                <div className="flex relative justify-start">
                  {currentUser && (
                    <SubscribeButton
                      user={currentUser}
                      referral={referral}
                      payload={{ user: currentUser.id }}
                      index={index}
                    />
                  )}
                </div>
              </td>
            </>
          ) : null}

          {task == TaskParams.MY_DRAFTS ? (
            <td>
              <div className="flex relative justify-start">
                <button
                  className="z-10 button button-dangerous"
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
