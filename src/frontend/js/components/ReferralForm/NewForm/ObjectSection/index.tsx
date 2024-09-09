import React from 'react';
import { Title, TitleType } from '../../../text/Title';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Text, TextType } from '../../../text/Text';
import { TextArea } from '../../../text/TextArea';

const messages = defineMessages({
  objectSectionTitle: {
    defaultMessage: 'Purpose of request',
    description: 'Object section title',
    id: 'components.ObjectSection.title',
  },
  objectSectionText: {
    defaultMessage: 'Questions for which the legal department is consulted',
    description: 'Object section text',
    id: 'components.ObjectSection.text',
  },
});

export const ObjectSection: React.FC = () => {
  return (
    <section className="space-y-2">
      <Title type={TitleType.H6}>
        <FormattedMessage {...messages.objectSectionTitle} />
      </Title>
      <Text type={TextType.PARAGRAPH_SMALL}>
        <FormattedMessage {...messages.objectSectionText} />
      </Text>
      <TextArea maxLength={120} rows={5} />
    </section>
  );
};
