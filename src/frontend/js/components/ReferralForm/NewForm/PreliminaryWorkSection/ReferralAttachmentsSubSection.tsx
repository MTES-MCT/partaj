import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Title, TitleType } from '../../../text/Title';
import { Text, TextType } from '../../../text/Text';

const messages = defineMessages({
  attachedFilesTitle: {
    defaultMessage: 'Attached files',
    description: 'Text for attached files subsection title',
    id: 'components.ReferralAttachmentSubSection.attachedFilesTitle',
  },
  attachedFilesDescription: {
    defaultMessage:
      'Letter of referral, documents needed to understand and analyse the analysis of the question posed, preparatory work',
    description: 'Text for attached files subsection description',
    id: 'components.ReferralAttachmentSubSection.attachedFilesDescription',
  },
});

export const ReferralAttachmentSubSection: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  return (
    <div className="space-y-2">
      <Text type={TextType.PARAGRAPH_NORMAL} className="font-medium">
        <FormattedMessage {...messages.attachedFilesTitle}></FormattedMessage>
      </Text>
      <Text type={TextType.PARAGRAPH_SMALL}>
        <FormattedMessage
          {...messages.attachedFilesDescription}
        ></FormattedMessage>
      </Text>
      {children}
    </div>
  );
};
