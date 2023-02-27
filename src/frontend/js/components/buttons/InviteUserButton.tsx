import React, { useContext } from 'react';
import {
  ReferralLite,
  ReferralUserAction,
  ReferralUserRole,
  UserLite,
} from '../../types';
import { Nullable } from '../../types/utils';
import { defineMessages, FormattedMessage } from 'react-intl';
import { AddIcon, CheckIcon, IconColor } from '../Icons';
import { appData } from '../../appData';
import { useMutation } from 'react-query';
import { Spinner } from '../Spinner';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { ReferralUsersModalContext } from '../../data/providers/ReferralUsersModalProvider';
import { isValidEmail } from '../../utils/string';

const messages = defineMessages({
  add: {
    defaultMessage: 'Add',
    description: 'referral invite user button title',
    id: 'components.InviteUserButton.add',
  },
});

type UserActionParams = {
  action: ReferralUserAction;
  payload: any;
};

export const InviteUserButton = ({
  role,
  referral,
}: {
  user: Nullable<UserLite>;
  role: ReferralUserRole;
  referral: ReferralLite;
}) => {
  const { refetch } = useContext(ReferralContext);
  const {
    showRUModal,
    closeRUModal,
    emailInputValue,
    setEmailErrorMessage,
  } = useContext(ReferralUsersModalContext);

  const userAction = async (params: UserActionParams) => {
    const response = await fetch(
      `/api/referrals/${referral.id}/${params.action}/`,
      {
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          ...params.payload,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to call user API for referral ${referral.id} and email ${emailInputValue}`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(
    (params: UserActionParams) => userAction(params),
    {
      onSuccess: () => {
        refetch();
        if (showRUModal) {
          closeRUModal();
        }
      },
    },
  );

  return (
    <>
      {mutation.isSuccess ? (
        <div className="flex items-center justify-left">
          <CheckIcon color={IconColor.SUCCESS_700} />
          <span className="text-success-700">Ajouté</span>
        </div>
      ) : (
        <button
          className={`action-button action-button-light-gray`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isValidEmail(emailInputValue)) {
              setEmailErrorMessage(
                "L'email que vous avez renseigné n'est pas valide",
              );
              return 0;
            }
            mutation.mutate({
              action: ReferralUserAction.INVITE_USER,
              payload: {
                email: emailInputValue,
                role: role,
              },
            });
          }}
        >
          <>
            {mutation.isLoading ? (
              <div className="flex items-center w-4">
                <Spinner size="small" color="#8080D1" className="inset-0" />
              </div>
            ) : (
              <>
                <AddIcon color={IconColor.PRIMARY_1000} />
                <span>
                  <FormattedMessage {...messages.add} />
                </span>
              </>
            )}
          </>
        </button>
      )}
    </>
  );
};
