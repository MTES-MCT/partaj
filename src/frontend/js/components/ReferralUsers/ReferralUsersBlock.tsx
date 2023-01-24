import { defineMessages } from '@formatjs/intl';
import React, { useContext, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { useReferralAction } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { Message } from 'types';
import { ReferralUsersTable } from './ReferralUsersTable';

const messages = defineMessages({
  title: {
    defaultMessage: 'Business service',
    description: 'Title for users block',
    id: 'components.ReferralUsersBlock.title',
  },
});

interface ReferralUsersBlockProps {
  referral: types.Referral;
}

export const ReferralUsersBlock: React.FC<ReferralUsersBlockProps> = ({
  referral,
}) => {
  const seed = useUIDSeed();
  const intl = useIntl();
  const { currentUser } = useCurrentUser();
  const { refetch } = useContext(ReferralContext);
  const [isAddingRequester, setAddingRequester] = useState(false);
  // Use a key to reset the autosuggest field when the form is completed and sent
  const [key, setKey] = useState(0);
  const addRequesterMutation = useReferralAction({
    onSuccess: () => {
      refetch();
    },
    onSettled: () => {
      setKey((key) => key + 1);
      addRequesterMutation.reset();
    },
  });

  return (
    <div className={`w-full space-y-4`}>
      <h3 className={`text-h3`}>
        <FormattedMessage {...messages.title} />
      </h3>
      <ReferralUsersTable referral={referral}> </ReferralUsersTable>
    </div>
  );
};
