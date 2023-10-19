import React, { useContext, useEffect, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { MailIcon } from '../../Icons';
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

const messages = defineMessages({
  emailSearchInput: {
    defaultMessage: 'Enter the email of the person to add',
    description: 'Placeholder and title of the email search input',
    id: 'components.UserInvitation.emailSearchInput',
  },
  invalidEmailError: {
    defaultMessage: 'The specified email is invalid',
    description:
      'Error message when the email entered in the email search input is invalid',
    id: 'components.UserInvitation.invalidEmail',
  },
});

export const UserInvitation = () => {
  const intl = useIntl();

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
            <MailIcon className="fill-gray500" />
          </div>
          <input
            ref={inputRef}
            placeholder={intl.formatMessage(messages.emailSearchInput)}
            title={intl.formatMessage(messages.emailSearchInput)}
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
                      referral={referral}
                      action={ReferralUserAction.INVITE_USER}
                      payload={{ email: emailInputValue }}
                      beforeOnClick={() => {
                        if (!isValidEmail(emailInputValue)) {
                          setEmailErrorMessage(
                            intl.formatMessage(messages.invalidEmailError),
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
