import React, { useContext, useEffect, useState } from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { TextArea } from '../../../text/TextArea';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { usePatchReferralAction } from '../../../../data/referral';
import { Referral } from '../../../../types';
import { ReferralFormContext } from '../../../../data/providers/ReferralFormProvider';
import { FormSection } from '../FormSection';
import { ErrorIcon } from '../../../Icons';

const messages = defineMessages({
  questionSectionTitle: {
    defaultMessage: 'Purpose of request',
    description: 'Object section title',
    id: 'components.QuestionSection.title',
  },
  questionSectionText: {
    defaultMessage: 'Questions for which the legal department is consulted',
    description: 'Object section text',
    id: 'components.QuestionSection.text',
  },
});

export const QuestionSection: React.FC = () => {
  const { referral, setReferral } = useContext(ReferralContext);
  const patchReferralMutation = usePatchReferralAction();
  const { errors } = useContext(ReferralFormContext);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setHasError(errors.hasOwnProperty('question'));
  }, [errors]);

  const updateQuestion = (value: string) => {
    referral &&
      patchReferralMutation.mutate(
        {
          id: referral.id,
          question: value,
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
        <FormattedMessage {...messages.questionSectionTitle} />
      </Title>
      <Text
        type={TextType.PARAGRAPH_SMALL}
        className={hasError ? 'text-dsfr-danger-500' : 'text-black'}
      >
        <FormattedMessage {...messages.questionSectionText} />
      </Text>
      {referral && (
        <TextArea
          onDebounce={(value: string) => updateQuestion(value)}
          maxLength={120}
          rows={5}
          defaultValue={referral.question}
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
            Veuillez renseigner une question
          </Text>
        </div>
      )}
    </FormSection>
  );
};
