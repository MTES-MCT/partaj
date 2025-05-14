import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral } from 'types';
import * as Sentry from '@sentry/react';
import { usePatchReferralAction } from '../../../data/referral';
import { TextArea, TextAreaStyle } from '../../text/TextArea';
import { Title, TitleType } from '../../text/Title';
import { Text, TextType } from '../../text/Text';

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

export const SubTitleField: React.FC<SubTitleFieldProps> = ({ referral }) => {
  const patchReferralMutation = usePatchReferralAction();

  const updateSubTitle = (value: string) => {
    referral &&
      patchReferralMutation.mutate(
        {
          id: referral.id,
          sub_title: value,
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
        <FormattedMessage {...messages.subTitleTitle} />
      </Title>
      <Text
        htmlFor="sub_title"
        type={TextType.LABEL_SMALL}
        className={'text-black'}
      >
        <FormattedMessage {...messages.subTitleDescription} />
      </Text>
      <TextArea
        id="sub_title"
        maxLength={120}
        style={TextAreaStyle.PURPLE}
        defaultValue={referral.sub_title}
        onDebounce={(value: string) => {
          updateSubTitle(value);
        }}
        hasError={false}
      />
    </div>
  );
};
