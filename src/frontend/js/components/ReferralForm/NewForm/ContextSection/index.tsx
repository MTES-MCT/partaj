import React, { useContext, useEffect, useState } from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { TextArea } from '../../../text/TextArea';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { Referral } from '../../../../types';
import { usePatchReferralAction } from '../../../../data/referral';
import { ReferralFormContext } from '../../../../data/providers/ReferralFormProvider';
import { ErrorIcon } from '../../../Icons';
import { FormSection } from '../FormSection';

const messages = defineMessages({
  title: {
    defaultMessage: 'Referral context',
    description: 'Context section title',
    id: 'components.ContextSection.title',
  },
  text: {
    defaultMessage:
      'Assessment of the facts of the case (political, technical, legal, etc.) useful for analyzing the question posed.',
    description: 'Context section text',
    id: 'components.ContextSection.text',
  },
});

export const ContextSection: React.FC = () => {
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
        },
      );
  };

  return (
    <FormSection hasError={hasError}>
      <Title
        type={TitleType.H6}
        className={hasError ? 'text-dsfr-danger-500' : 'text-black'}
      >
        <FormattedMessage {...messages.title} />
      </Title>
      <Text
        type={TextType.PARAGRAPH_SMALL}
        className={hasError ? 'text-dsfr-danger-500' : 'text-black'}
      >
        <FormattedMessage {...messages.text} />
      </Text>

      {referral && (
        <TextArea
          onDebounce={(value: string) => updateContext(value)}
          defaultValue={referral.context}
          maxLength={120}
          rows={4}
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
            Veuillez sélectionner un contexte
          </Text>
        </div>
      )}
    </FormSection>
  );
};
