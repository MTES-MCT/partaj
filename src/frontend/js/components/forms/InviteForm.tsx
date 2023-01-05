import React, { useContext, useState } from 'react';

import { useReferralAction } from 'data';
import { SubmitButton } from '../buttons/SubmitButton';
import * as types from '../../types';
import { isValidEmail } from '../../utils/string';
import { ReferralContext } from '../../data/providers/ReferralProvider';

interface InviteFormProps {
  referral: types.Referral;
  invitationRole: types.ReferralUserRole;
}

export const InviteForm: React.FC<InviteFormProps> = ({
  referral,
  invitationRole,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { refetch } = useContext(ReferralContext);

  const inviteMutation = useReferralAction({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.log('error 1');
      console.log(error);
    },
    onSettled: () => {
      inviteMutation.reset();
    },
  });

  return (
    <form
      style={{ padding: '0 3px 3px' }}
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValidEmail(inputValue)) {
          setErrorMessage("L'email que vous avez renseigné n'est pas valide");
          return 0;
        }
        inviteMutation.mutate(
          {
            action: 'invite',
            payload: {
              email: inputValue,
              invitationRole: invitationRole,
            },
            referral,
          },
          {
            onError: (error) => {
              console.log('ERROR 2');
              console.log(error);
            },
          },
        );
      }}
    >
      <div className="flex">
        <input
          placeholder="jean-michel@developpementdurable.fr"
          className={`search-input`}
          type="text"
          aria-label="email"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
        />
        <SubmitButton>Inviter</SubmitButton>
      </div>
      <span>{errorMessage}</span>
    </form>
  );
};
