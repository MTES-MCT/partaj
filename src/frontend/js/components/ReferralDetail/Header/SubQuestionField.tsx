import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral } from 'types';
import { Title, TitleType } from '../../text/Title';
import { Text, TextType } from '../../text/Text';
import { TextAreaSize } from '../../text/TextArea';
import { ReferralHeaderFormField } from './ReferralHeaderFormField';

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
  return (
    <div className="pt-4">
      <Title type={TitleType.H6} className={'text-black'}>
        <FormattedMessage {...messages.subQuestionTitle} />
      </Title>
      <Text htmlFor="sub_title" type={TextType.LABEL_DESCRIPTION}>
        <FormattedMessage {...messages.subQuestionDescription} />
      </Text>
      <ReferralHeaderFormField
        initialValue={referral.sub_question || ''}
        name="sub_question"
        areaProperties={{
          size: TextAreaSize.S,
        }}
      />
    </div>
  );
};
