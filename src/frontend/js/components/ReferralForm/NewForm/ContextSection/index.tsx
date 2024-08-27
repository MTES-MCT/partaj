import React from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { TextArea } from '../../../text/TextArea';

const messages = defineMessages({
  title: {
    defaultMessage: 'Referral context',
    description: 'Context section title',
    id: 'components.ContextSection.title',
  },
  text: {
    defaultMessage: 'Assessment of the facts of the case (political, technical, legal, etc.) useful for analyzing the question posed.',
    description: 'Context section text',
    id: 'components.ContextSection.text',
  },
});

export const ContextSection: React.FC = () => {
  return (
    <section className="space-y-2">
      <Title type={TitleType.H6}>
        <FormattedMessage {...messages.title} />
      </Title>
      <Text type={TextType.PARAGRAPH_SMALL}>
        <FormattedMessage {...messages.text} />
      </Text>
      <TextArea maxLength={120} rows={4}/>
    </section>
  );
};
