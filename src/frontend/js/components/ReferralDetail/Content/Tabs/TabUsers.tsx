import React, { useContext } from 'react';
import { ReferralUsersBlock } from '../../../ReferralUsers/ReferralUsersBlock';
import { ReferralUsersModalProvider } from '../../../../data/providers/ReferralUsersModalProvider';
import { RoleModalProvider } from '../../../../data/providers/RoleModalProvider';
import { Modals } from '../../../modals/Modals';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { defineMessages, FormattedMessage } from 'react-intl';
import { ReferralState } from 'types';

const messages = defineMessages({
  unavailableRequesterTab: {
    defaultMessage: 'Adding requesters is not avaiblable in a splitting mode',
    description: 'Unavailable requester tab text',
    id: 'components.ReferralTabs.unavailableRequesterTab',
  },
});

export const TabUsers: React.FC = () => {
  const { referral } = useContext(ReferralContext);

  return (
    <>
      {referral &&
        ([ReferralState.SPLITTING, ReferralState.RECEIVED_SPLITTING].includes(
          referral.state,
        ) ? (
          <div>
            <FormattedMessage {...messages.unavailableRequesterTab} />
          </div>
        ) : (
          <ReferralUsersModalProvider>
            <RoleModalProvider>
              <ReferralUsersBlock />
              <Modals />
            </RoleModalProvider>
          </ReferralUsersModalProvider>
        ))}
    </>
  );
};
