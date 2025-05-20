import React, { useState } from 'react';
import { FormattedDate, defineMessages, FormattedMessage } from 'react-intl';
import { Link, useHistory } from 'react-router-dom';
import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { ReferralLite, TaskParams } from 'types';
import { getUserShortname } from 'utils/user';
import { useCurrentUser } from '../../data/useCurrentUser';
import { SubscribeButton } from '../buttons/SubscribeButton';
import { useDeleteAction } from 'data';
import { Spinner } from 'components/Spinner';
import { ArrowCornerDownRight } from '../Icons';

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
          <td className="text-sm">{referral.id}</td>
          <td className="text-sm">
            <div className="flex items-center">
              {referral.due_date !== null ? (
                <FormattedDate value={referral.due_date} />
              ) : null}
            </div>
          </td>
          <td className="text-sm min-w-272 max-w-304">
            <Link
              className="stretched-link"
              to={getReferralUrl(referral)}
              onClick={(e) => e.preventDefault()}
            >
              <div className="flex flex-col">
                <span> {referral.object}</span>
                {referral.sub_title && (
                  <div className="flex items-stretch">
                    <div className="flex items-start flex-shrink-0 mt-1">
                      <ArrowCornerDownRight className="w-4 h-4 fill-primary400" />
                    </div>
                    <span className="text-sm"> {referral.sub_title}</span>
                  </div>
                )}
              </div>
            </Link>
          </td>
          <td className="text-sm">
            {referral.users
              .map((user) => (
                <p key={`${referral.id}-${user.id}`}>{user.unit_name}</p>
              ))
              .sort()}
          </td>
          {task != TaskParams.MY_DRAFTS ? (
            <td className="text-sm">
              {referral.assignees
                .map((assignee) => (
                  <p key={`${referral.id}-${assignee.id}`}>
                    {getUserShortname(assignee)}
                  </p>
                ))
                .sort()}
            </td>
          ) : null}
          <td className="text-sm">
            <ReferralStatusBadge status={referral.state} />
          </td>
          {task != TaskParams.MY_DRAFTS ? (
            <>
              <td className="text-sm">
                {referral.published_date !== null ? (
                  <FormattedDate value={referral.published_date} />
                ) : null}
              </td>
              <td className="text-sm">
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
            <td className="text-sm">
              <div className="flex relative justify-start">
                <button
                  className="z-10 button button-dangerous"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(
                      {
                        name: 'referrals',
                        id: referral.id,
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
