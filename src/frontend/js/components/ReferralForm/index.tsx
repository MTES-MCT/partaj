import React from 'react';
import { useReferral } from '../../data';
import { NewReferralForm } from './NewForm';
import { OldReferralForm } from './OldReferralForm';
import { useParams } from 'react-router-dom';
import { GenericErrorMessage } from '../GenericErrorMessage';
import { Spinner } from '../Spinner';
import { FormattedMessage } from 'react-intl';
import { ReferralDetailRouteParams } from '../ReferralDetail';
import { commonMessages } from '../../const/translations';
import { useTitle } from 'utils/useTitle';

export const ReferralForm: React.FC = () => {
  const { referralId } = useParams<ReferralDetailRouteParams>();
  useTitle('referralForm', { referralId });
  const { status, data: referral } = useReferral(referralId);

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner>
          <FormattedMessage {...commonMessages.genericLoadingMessage} />
        </Spinner>
      );

    case 'success':
      return (
        <>
          {referral && (
            <>
              {' '}
              {referral.ff_new_form ? (
                <NewReferralForm referral={referral} />
              ) : (
                <OldReferralForm />
              )}
            </>
          )}
        </>
      );
  }
};
