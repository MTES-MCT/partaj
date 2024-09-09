import React from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { TextArea } from '../../../text/TextArea';

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
  return (
    <section className="space-y-2">
      <Title type={TitleType.H6}>
        <FormattedMessage {...messages.titleSectionTitle} />
      </Title>
      <Text type={TextType.PARAGRAPH_SMALL}>
        <FormattedMessage {...messages.titleSectionText} />
      </Text>
      <TextArea maxLength={120} rows={2} />
    </section>
  );
};
