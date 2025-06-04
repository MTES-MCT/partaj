import React, { useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral } from 'types';
import { Title, TitleType } from '../../text/Title';
import { Text, TextType } from '../../text/Text';
import { TextAreaSize } from '../../text/TextArea';
import { ReferralHeaderFormField } from './ReferralHeaderFormField';
import { useSubReferral } from '../../../data/providers/SubReferralProvider';
import { ReferralContext } from '../../../data/providers/ReferralProvider';

const messages = defineMessages({
  subTitleTitle: {
    defaultMessage: 'Sub referral title',
    description: 'Sub referral title text',
    id: 'components.SubTitleField.subTitleTitle',
  },
  subTitleDescription: {
    defaultMessage:
      'Reformulate the title to distinguish the sub-sections of the referral. This title will appear on the dashboard and on the referral once it has been published.',
    description: 'Sub referral title description',
    id: 'components.SubTitleField.subTitleDescription',
  },
});

interface SubTitleFieldProps {
  referral: Referral;
}

export const SubTitleField: React.FC<SubTitleFieldProps> = () => {
  const { subFormState, updateSubForm } = useSubReferral();
  const { setReferral } = useContext(ReferralContext);

  return (
    <div className="pt-4">
      <Title type={TitleType.H6} className={'text-black'}>
        <FormattedMessage {...messages.subTitleTitle} />
      </Title>
      <Text htmlFor="sub_title" type={TextType.LABEL_DESCRIPTION}>
        <FormattedMessage {...messages.subTitleDescription} />
      </Text>
      <ReferralHeaderFormField
        value={subFormState['sub_title'].currentValue}
        onChange={(value: string) =>
          updateSubForm('sub_title', {
            currentValue: value,
            savedValue: subFormState['sub_title'].savedValue,
            state:
              value === subFormState['sub_title'].savedValue
                ? 'saved'
                : 'changed',
          })
        }
        state={subFormState['sub_title'].state}
        onSuccess={(referral: Referral) => {
          setReferral(referral);
          updateSubForm('sub_title', {
            currentValue: referral.sub_title,
            savedValue: referral.sub_title,
            state: 'saved',
          });
        }}
        name="sub_title"
        areaProperties={{
          maxLength: 120,
          size: TextAreaSize.ONE_LINE,
        }}
      />
    </div>
  );
};
