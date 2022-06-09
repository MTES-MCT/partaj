import * as Sentry from '@sentry/react';
import React from 'react';
import { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQueryClient, useMutation } from 'react-query';
import { useHistory } from 'react-router-dom';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { Referral, ReferralState } from 'types';

const messages = defineMessages({
  draftReferral: {
    defaultMessage: 'Create a referral',
    description: 'Button to create a new referral.',
    id: 'components.CreateReferralButton.draftReferral',
  },
  failedToCreate: {
    defaultMessage: 'Failed to create a new referral',
    description: 'Error message when referral  creation failed .',
    id: 'components.CreateReferralButton.failedToCreate',
  },
});

export const CreateReferralButton: React.FC = () => {
  const queryClient = useQueryClient();
  const history = useHistory();

  const [referralId, setReferralId] = useState<string>('');

  const createReferralAction = async () => {
    const response = await fetch('/api/referrals/', {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to create a new Referral CreateReferralButton.');
    }
    return await response.json();
  };

  const mutation = useMutation(createReferralAction, {
    onSuccess: (data, variables, context) => {
      history.push(`/new-referral/${data['id']}`);
    },
  });

  return (
    <button
      className={`btn btn-primary-outline flex items-center space-x-2 mx-6`}
      onClick={() => mutation.mutate()}
      aria-busy={mutation.isLoading}
      aria-disabled={mutation.isLoading}
    >
      <svg role="img" className="navbar-icon" aria-hidden="true">
        <use xlinkHref={`${appData.assets.icons}#icon-plus`} />
      </svg>
      {mutation.isLoading ? (
        <span aria-hidden="true">
          <span className="opacity-0">
            <FormattedMessage {...messages.draftReferral} />
          </span>
          <Spinner size="small" color="white" className="absolute inset-0">
            {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
          </Spinner>
        </span>
      ) : (
        <span>
          <FormattedMessage {...messages.draftReferral} />
        </span>
      )}
    </button>
  );
};
