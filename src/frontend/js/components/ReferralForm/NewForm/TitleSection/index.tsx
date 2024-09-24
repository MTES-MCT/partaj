import React, { useContext } from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { TextArea } from '../../../text/TextArea';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { Referral } from '../../../../types';
import { usePatchReferralAction } from '../../../../data/referral';

const messages = defineMessages({
  titleSectionTitle: {
    defaultMessage: "Referral's title",
    description: 'Ttle section title',
    id: 'components.TitleSection.title',
  },
  titleSectionText: {
    defaultMessage: 'Brief description of the title of this referral\n' + '\n',
    description: 'Requester unit type section text',
    id: 'components.TitleSection.text',
  },
});

export const TitleSection: React.FC = () => {
  const { referral, setReferral } = useContext(ReferralContext);
  const patchReferralMutation = usePatchReferralAction();

  const updateTitle = (value: string) => {
    referral &&
      patchReferralMutation.mutate(
        {
          id: referral.id,
          object: value,
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
        <FormattedMessage {...messages.titleSectionTitle} />
      </Title>
      <Text type={TextType.PARAGRAPH_SMALL}>
        <FormattedMessage {...messages.titleSectionText} />
      </Text>
      {referral && (
        <TextArea
          maxLength={120}
          rows={2}
          defaultValue={referral.title}
          onDebounce={(value: string) => {
            updateTitle(value);
          }}
        />
      )}
    </section>
  );
};
