import { defineMessages } from '@formatjs/intl';
import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { ReferralUsersTable } from './ReferralUsersTable';
import { IconTextButton } from '../buttons/IconTextButton';
import { AddIcon } from '../Icons';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { ReferralUsersModalContext } from '../../data/providers/ReferralUsersModalProvider';
import { ReferralState } from '../../types';
import { DescriptionText } from '../styled/text/DescriptionText';
import { useUIDSeed } from 'react-uid';

const messages = defineMessages({
  title: {
    defaultMessage: 'Business service',
    description: 'Title for users block',
    id: 'components.ReferralUsersBlock.title',
  },
  formLabel: {
    defaultMessage: 'Requesters for this referral',
    description: 'Label for requesters form',
    id: 'components.ReferralUsersBlock.formLabel',
  },
  formDescription: {
    defaultMessage:
      'Add the members of your department who initiated the referral. Please add at least one representative of your hierarchy.',
    description: 'Description for requesters form',
    id: 'components.ReferralUsersBlock.formDescription',
  },
  addUser: {
    defaultMessage: 'Add new user',
    description: 'CTA add users button title',
    id: 'components.ReferralUsersBlock.addUser',
  },
});

export const ReferralUsersBlock: React.FC = () => {
  const { referral } = useContext(ReferralContext);
  const { openRUModal } = useContext(ReferralUsersModalContext);
  const seed = useUIDSeed();

  return (
    <>
      {referral && (
        <>
          <div className={`w-full space-y-4`}>
            {referral.state === ReferralState.DRAFT ? (
              <div>
                <label
                  htmlFor={seed('referral-users-label')}
                  className="mb-1 font-semibold"
                >
                  <FormattedMessage {...messages.formLabel} />
                </label>
                <DescriptionText>
                  <FormattedMessage {...messages.formDescription} />
                </DescriptionText>
              </div>
            ) : (
              <h3 className={`text-h3`}>
                <FormattedMessage {...messages.title} />
              </h3>
            )}
            {referral && <ReferralUsersTable referral={referral} />}
            <IconTextButton
              onClick={() => openRUModal({ referral })}
              testId="add-user-button"
              icon={<AddIcon />}
              otherClasses="action-button action-button-gray"
            >
              <FormattedMessage {...messages.addUser} />
            </IconTextButton>
          </div>
        </>
      )}
    </>
  );
};
