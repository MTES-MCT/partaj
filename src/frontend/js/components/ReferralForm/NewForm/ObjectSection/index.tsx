import React, { useContext, useEffect, useState } from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { TextArea } from '../../../text/TextArea';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { Referral } from '../../../../types';
import { usePatchReferralAction } from '../../../../data/referral';
import { FormSection } from '../FormSection';
import { ReferralFormContext } from '../../../../data/providers/ReferralFormProvider';
import { ErrorIcon } from '../../../Icons';
import * as Sentry from '@sentry/react';

const messages = defineMessages({
  objectSectionText: {
    defaultMessage: 'Brief description of the title of this referral',
    description: 'Requester unit type section text',
    id: 'components.ObjectSection.text',
  },
  errorMessage: {
    defaultMessage: 'Please enter a title for your request',
    description:
      'Error message showed when object field has an invalid value in the referral form',
    id: 'components.ObjectSection.errorMessage',
  },
});

export const ObjectSection: React.FC<{ title: string }> = ({ title }) => {
  const { referral, setReferral } = useContext(ReferralContext);
  const patchReferralMutation = usePatchReferralAction();

  const { errors } = useContext(ReferralFormContext);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setHasError(errors.hasOwnProperty('object'));
  }, [errors]);

  const updateObject = (value: string) => {
    referral &&
      patchReferralMutation.mutate(
        {
          id: referral.id,
          object: value,
        },
        {
          onSuccess: (referral: Referral) => {
            setReferral(referral);
          },
          onError: (error) => {
            Sentry.captureException(error);
          },
        },
      );
  };

  return (
    <FormSection hasError={hasError}>
      <Title
        type={TitleType.H6}
        className={hasError ? 'text-dsfr-danger-500' : 'text-black'}
      >
        {title}
      </Title>
      <Text
        htmlFor="object"
        type={TextType.LABEL_SMALL}
        className={hasError ? 'text-dsfr-danger-500' : 'text-black'}
      >
        <FormattedMessage {...messages.objectSectionText} />
      </Text>
      {referral && (
        <TextArea
          id="object"
          maxLength={120}
          defaultValue={referral.object}
          onDebounce={(value: string) => {
            updateObject(value);
          }}
          hasError={hasError}
        />
      )}
      {hasError && (
        <div className="flex items-center space-x-1">
          <ErrorIcon className="fill-dsfr-danger-500" />
          <Text
            type={TextType.SPAN_SUPER_SMALL}
            className="text-dsfr-danger-500 font-normal"
          >
            <FormattedMessage {...messages.errorMessage} />
          </Text>
        </div>
      )}
    </FormSection>
  );
};
