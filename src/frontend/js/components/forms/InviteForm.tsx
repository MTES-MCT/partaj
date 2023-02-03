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
    onSettled: () => {
      inviteMutation.reset();
    },
  });

  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValidEmail(inputValue)) {
          setErrorMessage("L'email que vous avez renseigné n'est pas valide");
          return 0;
        }
        inviteMutation.mutate({
          action: 'invite',
          payload: {
            email: inputValue,
            invitationRole: invitationRole,
          },
          referral,
        });
      }}
    >
      <div className="flex space-x-3 max-w-xs">
        <input
          placeholder=" exemple@domaine.gouv.fr"
          className={`search-input search-input-gray`}
          type="text"
          aria-label="email"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
        />
        <SubmitButton className="btn-sm btn-gray rounded-sm px-2">
          Inviter
        </SubmitButton>
      </div>
      <span>{errorMessage}</span>
    </form>
  );
};
