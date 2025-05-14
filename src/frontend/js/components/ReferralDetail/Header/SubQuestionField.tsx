import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral } from 'types';
import * as Sentry from '@sentry/react';
import { usePatchReferralAction } from '../../../data/referral';
import { TextArea, TextAreaSize, TextAreaStyle } from '../../text/TextArea';
import { Title, TitleType } from '../../text/Title';
import { Text, TextType } from '../../text/Text';

const messages = defineMessages({
  subQuestionTitle: {
    defaultMessage: 'Rephrasing the question',
    description: 'Sub referral question text',
    id: 'components.SubQuestionField.subQuestionTitle',
  },
  subQuestionDescription: {
    defaultMessage:
      'Indicate in this field which part of the initial referral this sub-referral will address. Once the referral has been published, this field will be integrated into the referral and can be consulted by requesters.',
    description: 'Sub referral question description',
    id: 'components.SubQuestionField.subQuestionDescription',
  },
});

interface SubQuestionFieldProps {
  referral: Referral;
}

export const SubQuestionField: React.FC<SubQuestionFieldProps> = ({
  referral,
}) => {
  const patchReferralMutation = usePatchReferralAction();

  const update = (value: string) => {
    referral &&
      patchReferralMutation.mutate(
        {
          id: referral.id,
          sub_question: value,
        },
        {
          onSuccess: (referral: Referral) => {
            console.log(referral);
          },
          onError: (error) => {
            Sentry.captureException(error);
          },
        },
      );
  };

  return (
    <div>
      <Title type={TitleType.H6} className={'text-black'}>
        <FormattedMessage {...messages.subQuestionTitle} />
      </Title>
      <Text
        htmlFor="object"
        type={TextType.LABEL_SMALL}
        className={'text-black'}
      >
        <FormattedMessage {...messages.subQuestionDescription} />
      </Text>
      <TextArea
        id="sub_title"
        style={TextAreaStyle.PURPLE}
        size={TextAreaSize.L}
        defaultValue={referral.sub_question}
        onDebounce={(value: string) => {
          update(value);
        }}
        hasError={false}
      />
    </div>
  );
};
