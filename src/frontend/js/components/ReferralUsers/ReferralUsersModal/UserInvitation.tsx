import { MailIcon } from '../../Icons';
import React, { useContext, useEffect, useRef } from 'react';
import { ReferralUsersModalContext } from '../../../data/providers/ReferralUsersModalProvider';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import {
  ReferralState,
  ReferralUserAction,
  ReferralUserRole,
  User,
} from '../../../types';
import { RoleButton } from '../../buttons/RoleButton';
import { InviteUserButton } from '../../buttons/InviteUserButton';
import { isValidEmail } from '../../../utils/string';

export const UserInvitation = () => {
  const { referral } = useContext(ReferralContext);
  const {
    tabActive,
    emailInputValue,
    setEmailInputValue,
    setEmailErrorMessage,
    emailErrorMessage,
  } = useContext(ReferralUsersModalContext);

  const inputRef = useRef(null);

  useEffect(() => {
    if (tabActive === 'email') {
      inputRef && (inputRef.current! as HTMLElement).focus();
    }
  }, [tabActive]);

  return (
    <div className="relative bg-white overflow-hidden flex flex-col flex-grow">
      <div className="flex sticky z-20 top-0 left-0 right-0">
        <div className={`flex w-full`}>
          <div className="flex bg-gray-300 items-center p-1">
            <MailIcon color="gray500" />
          </div>
          <input
            ref={inputRef}
            placeholder="Entrer l'email de la personne à ajouter"
            className={`search-input search-input-gray`}
            type="text"
            aria-label="auto-email"
            value={emailInputValue}
            onChange={(e) => {
              setEmailInputValue(e.target.value);
              setEmailErrorMessage(null);
            }}
          />
        </div>
      </div>
      <div className="flex flex-col flex-grow items-center bg-white">
        <>
          {emailInputValue ? (
            <div className="flex w-full items-center justify-start relative user-item">
              <div className="flex flex-col w-352">
                <p className="text-primary-1000 py-4">{emailInputValue}</p>
                <p className="text-danger-500 absolute bottom-0 text-sm">
                  {emailErrorMessage}
                </p>
              </div>
              {referral && (
                <div className="flex justify-start">
                  {referral.state === ReferralState.DRAFT ? (
                    <InviteUserButton
                      role={ReferralUserRole.REQUESTER}
                      referral={referral}
                      user={{ email: emailInputValue } as User}
                    />
                  ) : (
                    <RoleButton
                      role={null}
                      user={null}
                      action={ReferralUserAction.INVITE_USER}
                      payload={{ email: emailInputValue }}
                      beforeOnClick={() => {
                        if (!isValidEmail(emailInputValue)) {
                          setEmailErrorMessage(
                            "L'email que vous avez renseigné n'est pas valide",
                          );
                          return 0;
                        }
                        return 1;
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ) : null}
        </>
      </div>
    </div>
  );
};
