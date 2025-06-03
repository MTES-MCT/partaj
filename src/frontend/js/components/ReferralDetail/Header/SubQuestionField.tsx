import React, { useContext, useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral } from 'types';
import { Title, TitleType } from '../../text/Title';
import { Text, TextType } from '../../text/Text';
import { TextAreaSize } from '../../text/TextArea';
import { ReferralHeaderFormField } from './ReferralHeaderFormField';
import { useSubReferral } from '../../../data/providers/SubReferralProvider';
import { ReferralContext } from '../../../data/providers/ReferralProvider';

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

export const SubQuestionField: React.FC<SubQuestionFieldProps> = () => {
  const { subFormState, updateSubForm } = useSubReferral();
  const { setReferral } = useContext(ReferralContext);

  return (
    <div className="pt-4">
      <Title type={TitleType.H6} className={'text-black'}>
        <FormattedMessage {...messages.subQuestionTitle} />
      </Title>
      <Text htmlFor="sub_question" type={TextType.LABEL_DESCRIPTION}>
        <FormattedMessage {...messages.subQuestionDescription} />
      </Text>
      <ReferralHeaderFormField
        value={subFormState['sub_question'].currentValue}
        onChange={(value: string) =>
          updateSubForm('sub_question', {
            currentValue: value,
            savedValue: subFormState['sub_question'].savedValue,
            state:
              value === subFormState['sub_question'].savedValue
                ? 'saved'
                : 'changed',
          })
        }
        state={subFormState['sub_question'].state}
        onSuccess={(referral: Referral) => {
          setReferral(referral);
          updateSubForm('sub_question', {
            currentValue: referral.sub_question,
            savedValue: referral.question,
            state: 'saved',
          });
        }}
        name="sub_question"
        areaProperties={{
          size: TextAreaSize.S,
        }}
      />
    </div>
  );
};
