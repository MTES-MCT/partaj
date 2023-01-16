import { defineMessages } from '@formatjs/intl';
import React, { useContext, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { AutocompleteUserField } from 'components/AutocompleteUserField';
import { Spinner } from 'components/Spinner';
import { useReferralAction } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { UserListItem } from '../UserListItem';
import { IconTextButton } from '../buttons/IconTextButton';
import { AddIcon } from '../Icons';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { UserList } from '../ReferralUsers/UserList';
import { InviteForm } from '../forms/InviteForm';
import { Message, ReferralUserRole } from 'types';

const messages = defineMessages({
  addRequester: {
    defaultMessage: 'Add a new requester',
    description: 'Add requester CTA text',
    id: 'components.RequestersBlock.addRequester',
  },
  findRequester: {
    defaultMessage: 'Enter the first name or last name',
    description: 'Placeholder for requester search input',
    id: 'components.RequestersBlock.findRequester',
  },
  invitationTitle: {
    defaultMessage: 'User not found? Please invite by email:',
    description: 'placeholder observer autossugect',
    id: 'components.RequestersBlock.invitationTitle',
  },
  invitationDescription: {
    defaultMessage:
      'Be sure to fill the mail address used for Cerbere authentication',
    description: 'Invitation description',
    id: 'components.RequestersBlock.invitationDescription',
  },
});

interface RequestersBlockProps {
  referral: types.Referral;
  title: Message;
  description: Message;
  invite?: boolean;
  size?: string;
}

export const RequestersBlock: React.FC<RequestersBlockProps> = ({
  referral,
  title,
  description,
  invite = false,
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

  const currentUserIsObserver = useMemo(
    () =>
      referral.observers.findIndex(
        (referralUser) => referralUser.id === currentUser?.id,
      ) !== -1,
    [referral, currentUser],
  );

  const currentUserIsFromRequesterUnit = useMemo(
    () =>
      referral.requesters.findIndex((referralUser) =>
        referralUser.unit_name.startsWith(currentUser?.unit_name || 'N/A'),
      ) !== -1,
    [referral, currentUser],
  );

  const currentUserIsReferralUnitMember = useMemo(
    () =>
      referral.units.findIndex(
        (unit) =>
          unit.members.findIndex(
            (unitMember) => unitMember.id === currentUser?.id,
          ) !== -1,
      ) !== -1,
    [referral, currentUser],
  );

  const currentUserCanPerformActions =
    currentUserIsFromRequesterUnit ||
    currentUserIsObserver ||
    currentUserIsReferralUnitMember;

  return (
    <div className={`w-full space-y-4`}>
      <div className="space-y-2">
        {referral.requesters && (
          <UserList
            title={title}
            description={description}
            showList={referral.requesters.length > 0}
          >
            <>
              {referral.requesters.map((user) => (
                <UserListItem
                  key={user.id}
                  action="remove_requester"
                  payload={{ user: user.id }}
                  currentUserCanPerformActions={
                    currentUserCanPerformActions &&
                    referral.requesters.length > 1
                  }
                  referral={referral}
                  user={user}
                />
              ))}
            </>
          </UserList>
        )}

        {isAddingRequester && currentUserCanPerformActions ? (
          <>
            <AutocompleteUserField
              filterSuggestions={(suggestions) =>
                suggestions.filter(
                  (user) =>
                    user.first_name &&
                    referral.requesters.findIndex(
                      (referralUser) => user.id === referralUser.id,
                    ) === -1,
                )
              }
              inputProps={{
                disabled: addRequesterMutation.isLoading,
                placeholder: intl.formatMessage(messages.findRequester),
                id: seed('add-requester-input-label'),
              }}
              key={key}
              onSuggestionSelected={(suggestion) =>
                addRequesterMutation.mutate(
                  {
                    action: 'add_requester',
                    payload: { user: suggestion.id },
                    referral,
                  },
                  {
                    onSuccess: () => setAddingRequester(false),
                  },
                )
              }
            />
            {addRequesterMutation.isLoading ? (
              <Spinner
                aria-hidden={true}
                className="absolute top-0 bottom-0"
                style={{ right: '1rem' }}
                size="small"
              />
            ) : null}
          </>
        ) : (
          <div key={'add-requester'} className="flex w-full items-left">
            <IconTextButton
              onClick={() => setAddingRequester(true)}
              testId="add-requester-button"
              otherClasses="btn-gray btn-sm"
              icon={<AddIcon />}
            >
              <FormattedMessage {...messages.addRequester} />
            </IconTextButton>
          </div>
        )}
      </div>
      {invite && (
        <div className="space-y-2">
          <div>
            <p>
              <FormattedMessage {...messages.invitationTitle} />
            </p>
            <p className="text-sm text-gray-500">
              <FormattedMessage {...messages.invitationDescription} />
            </p>
          </div>
          <InviteForm
            referral={referral}
            invitationRole={ReferralUserRole.REQUESTER}
          />
        </div>
      )}
    </div>
  );
};
