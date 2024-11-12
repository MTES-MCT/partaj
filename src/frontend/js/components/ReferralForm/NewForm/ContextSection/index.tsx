import React, { useContext, useEffect, useState } from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { TextArea, TextAreaSize } from '../../../text/TextArea';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { Referral } from '../../../../types';
import { usePatchReferralAction } from '../../../../data/referral';
import { ReferralFormContext } from '../../../../data/providers/ReferralFormProvider';
import { ErrorIcon } from '../../../Icons';
import { FormSection } from '../FormSection';
import * as Sentry from '@sentry/react';

const messages = defineMessages({
  text: {
    defaultMessage:
      'Assessment of the facts of the case (political, technical, legal, etc.) useful for analyzing the question posed.',
    description: 'Context section text',
    id: 'components.ContextSection.text',
  },
  errorMessage: {
    defaultMessage: 'Please enter a context for your request',
    description:
      'Error message showed when context field has an invalid value in the referral form',
    id: 'components.ContextSection.errorMessage',
  },
});

export const ContextSection: React.FC<{ title: string }> = ({ title }) => {
  const { referral, setReferral } = useContext(ReferralContext);
  const patchReferralMutation = usePatchReferralAction();
  const { errors } = useContext(ReferralFormContext);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setHasError(errors.hasOwnProperty('context'));
  }, [errors]);

  const updateContext = (value: string) => {
    referral &&
      patchReferralMutation.mutate(
        {
          id: referral.id,
          context: value,
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
        htmlFor="context"
        type={TextType.LABEL_SMALL}
        className={hasError ? 'text-dsfr-danger-500' : 'text-black'}
      >
        <FormattedMessage {...messages.text} />
      </Text>

      {referral && (
        <TextArea
          id="context"
          size={TextAreaSize.M}
          onDebounce={(value: string) => updateContext(value)}
          defaultValue={referral.context}
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
