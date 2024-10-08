import { defineMessages } from '@formatjs/intl';
import React, { useContext, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ReferralUsersTable } from './ReferralUsersTable';
import { IconTextButton } from '../buttons/IconTextButton';
import { AddIcon } from '../Icons';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { ReferralUsersModalContext } from '../../data/providers/ReferralUsersModalProvider';
import { ReferralState, RequesterUnitType } from '../../types';
import { DescriptionText } from '../styled/text/DescriptionText';
import { useUIDSeed } from 'react-uid';
import { Title, TitleType } from '../text/Title';
import { Text, TextType } from '../text/Text';

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
  decentralisedContactBlockTitle: {
    defaultMessage: 'Referent business service',
    description: 'Title for the decentralised service contact block',
    id: 'components.ReferralUsersBlock.decentralisedContactBlockTitle',
  },
  decentralisedContactBlockDescription: {
    defaultMessage:
      'The requester from a decentralised service contacted the following business service before requesting the DAJ. You can contact it in order to get additional informations.',
    description: 'Description for the decentralised service contact block',
    id: 'components.ReferralUsersBlock.decentralisedContactBlockDescription',
  },
  decentralisedContact: {
    defaultMessage: 'Email contact: {email}',
    description: 'Referent contact for the decentralised service',
    id: 'components.ReferralUsersBlock.decentralisedContact',
  },
});

export const ReferralUsersBlock: React.FC = () => {
  const { referral } = useContext(ReferralContext);
  const { openRUModal } = useContext(ReferralUsersModalContext);
  const seed = useUIDSeed();
  const intl = useIntl();
  const buttonRef = useRef(null);
  const showDecentralisedContactBlock =
    referral?.state !== ReferralState.DRAFT &&
    referral?.requester_unit_type === RequesterUnitType.DECENTRALISED_UNIT &&
    referral?.requester_unit_contact;

  return (
    <>
      {referral && (
        <>
          <div className={`w-full space-y-4`}>
            {showDecentralisedContactBlock && (
              <div
                className={
                  'px-6 py-4 bg-gray-200 border-gray-400 rounded border'
                }
              >
                <label
                  htmlFor={seed('referral-users-label')}
                  className="mb-1 font-semibold"
                >
                  <FormattedMessage
                    {...messages.decentralisedContactBlockTitle}
                  />
                </label>
                <DescriptionText>
                  <FormattedMessage
                    {...messages.decentralisedContactBlockDescription}
                  />
                </DescriptionText>
                <FormattedMessage
                  {...messages.decentralisedContact}
                  values={{
                    email: (
                      <a
                        className="text-primary-500 underline"
                        href={`mailto:${referral.requester_unit_contact}`}
                      >
                        {referral.requester_unit_contact}
                      </a>
                    ),
                  }}
                />
              </div>
            )}
            {referral.state === ReferralState.DRAFT ? (
              <div>
                <Title type={TitleType.H6}>
                  <FormattedMessage {...messages.formLabel} />
                </Title>
                <Text type={TextType.PARAGRAPH_SMALL}>
                  <FormattedMessage {...messages.formDescription} />
                </Text>
              </div>
            ) : (
              <h3 className={`text-h3`}>
                <FormattedMessage {...messages.title} />
              </h3>
            )}
            {referral && <ReferralUsersTable referral={referral} />}
            <IconTextButton
              buttonRef={buttonRef}
              onClick={() => openRUModal({ buttonRef })}
              icon={<AddIcon className="fill-primary700" />}
              otherClasses="border border-primary-700 text-primary-700 px-4 py-2"
              spanClasses="text-sm"
              text={intl.formatMessage(messages.addUser)}
            />
          </div>
        </>
      )}
    </>
  );
};
