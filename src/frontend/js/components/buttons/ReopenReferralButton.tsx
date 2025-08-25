import React, { useContext, useState } from 'react';
import { Referral } from '../../types';
import { defineMessages, FormattedMessage } from 'react-intl';
import { ArrowGoBackIcon, CheckIcon } from '../Icons';
import { ApiModalContext } from '../../data/providers/ApiModalProvider';
import { TextArea, TextAreaSize } from '../text/TextArea';
import { appData } from '../../appData';
import { useMutation } from 'react-query';
import * as Sentry from '@sentry/react';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { Text, TextType } from '../text/Text';

const messages = defineMessages({
  reopenReferral: {
    defaultMessage: 'Reopen referral',
    description: 'Reopen referral text button',
    id: 'components.ReferralHeader.reopenReferral',
  },
});

export const ReopenReferralButton = () => {
  const { openApiModal, closeApiModal } = useContext(ApiModalContext);
  const [value, setValue] = useState('');

  const { referral, setReferral } = useContext(ReferralContext);
  const reopenReferralAction = async () => {
    const response = await fetch(`/api/referrals/${referral?.id}/reopen/`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: value,
      }),
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error(
        `Failed to call reopen referral API for referral ${referral?.id}`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(() => reopenReferralAction(), {
    onSuccess: (referral: Referral) => {
      setReferral(referral);
      closeApiModal();
    },
    onError: (error) => {
      Sentry.captureException(error);
    },
  });

  return (
    <button
      className="btn btn-secondary"
      onClick={(e) => {
        openApiModal({
          title: 'Réouverture de la saisine',
          type: 'confirm',
          value: '',
          content: (value: string) => (
            <>
              <Text
                type={TextType.DSFR_LABEL_DESCRIPTION}
                htmlFor={'confirm-reopen-referral-modal'}
                font={'font-medium'}
              >
                Ajouter un commentaire pour justifier de la réouverture de la
                saisine
              </Text>
              <TextArea
                id={'confirm-reopen-referral-modal'}
                value={value}
                onChange={(text: string) => {
                  setValue(text);
                }}
                size={TextAreaSize.M}
              />
            </>
          ),
          button: (
            <button
              className="btn btn-primary"
              onClick={(e) => mutation.mutate()}
            >
              <div className="flex relative w-full space-x-1 items-center">
                <CheckIcon />
                <span>Confirmer</span>
              </div>
            </button>
          ),
        });
      }}
    >
      <div className="flex relative w-full space-x-1 items-center">
        <ArrowGoBackIcon />
        <span className="text-sm">
          <FormattedMessage {...messages.reopenReferral} />
        </span>
      </div>
    </button>
  );
};
