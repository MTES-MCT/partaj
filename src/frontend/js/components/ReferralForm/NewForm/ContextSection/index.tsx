import React, { useContext } from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { TextArea } from '../../../text/TextArea';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { Referral } from '../../../../types';
import { usePatchReferralAction } from '../../../../data/referral';

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
    <section className="space-y-2">
      <Title type={TitleType.H6}>
        <FormattedMessage {...messages.title} />
      </Title>
      <Text type={TextType.PARAGRAPH_SMALL}>
        <FormattedMessage {...messages.text} />
      </Text>
      {referral && (
        <TextArea
          onDebounce={(value: string) => updateContext(value)}
          defaultValue={referral.context}
          maxLength={120}
          rows={4}
        />
      )}
    </section>
  );
};
