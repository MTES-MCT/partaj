import React, { useContext, useEffect, useState } from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { TextArea, TextAreaSize } from '../../../text/TextArea';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { usePatchReferralAction } from '../../../../data/referral';
import { Referral } from '../../../../types';
import { ReferralFormContext } from '../../../../data/providers/ReferralFormProvider';
import { FormSection } from '../FormSection';
import { ErrorIcon } from '../../../Icons';

const messages = defineMessages({
  questionSectionText: {
    defaultMessage: 'Questions for which the legal department is consulted',
    description: 'Object section text',
    id: 'components.QuestionSection.text',
  },
  errorMessage: {
    defaultMessage: 'Please enter an object for your request',
    description:
      'Error message showed when question field has an invalid value in the referral form',
    id: 'components.QuestionSection.errorMessage',
  },
});

export const QuestionSection: React.FC<{ title: string }> = ({ title }) => {
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
        {title}
      </Title>
      <Text
        type={TextType.LABEL_SMALL}
        htmlFor="question"
        className={hasError ? 'text-dsfr-danger-500' : 'text-black'}
      >
        <FormattedMessage {...messages.questionSectionText} />
      </Text>
      {referral && (
        <TextArea
          id="question"
          size={TextAreaSize.S}
          onDebounce={(value: string) => updateQuestion(value)}
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
            <FormattedMessage {...messages.errorMessage} />
          </Text>
        </div>
      )}
    </FormSection>
  );
};
