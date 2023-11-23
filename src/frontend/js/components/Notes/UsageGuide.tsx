import React, { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import ReactHtmlParser from 'react-html-parser';
import { useClickOutside } from '../../utils/useClickOutside';

const messages = defineMessages({
  buttonText: {
    defaultMessage: 'Usage guide',
    description: 'Usage guide button title',
    id: 'components.UsageGuide.buttonText',
  },
  introduction: {
    defaultMessage:
      'Accessible only to DAJ lawyers from their PARTAJ application dashboard. It contains all the notices issued on PARTAJ. The form of the notices is authentic to the original format chosen by the author of the notice.',
    description: 'Usage guide introduction',
    id: 'components.UsageGuide.introduction',
  },
  documentationText: {
    defaultMessage: 'For more information, see ',
    description: 'Documentation text',
    id: 'components.UsageGuide.documentationText',
  },
  documentationLink: {
    defaultMessage: 'the documentation / Knowledge Base',
    description: 'Documentation link',
    id: 'components.UsageGuide.documentationLink',
  },
  title: {
    defaultMessage: 'How to search?',
    description: 'Usage guide modal title',
    id: 'components.UsageGuide.title',
  },
  mainTitle: {
    defaultMessage: 'Knowledge database',
    description: 'Usage guide modal main title',
    id: 'components.UsageGuide.mainTitle',
  },
  firstParagraph: {
    defaultMessage:
      '- By term(s) with the possibility to search for an “exact match” by using quotation marks for a word or phrase.',
    description: 'Usage guide first paragraph',
    id: 'components.UsageGuide.firstParagraph',
  },
  secondParagraph: {
    defaultMessage:
      '- and/or by Filters (Theme, DAJ Office, Jurist, Office applicant, Date of publication) with the possibility of applying multiple filters and search for terms with active filters.',
    description: 'Usage guide second paragraph',
    id: 'components.UsageGuide.secondParagraph',
  },
  firstParagraphComment: {
    defaultMessage:
      'When you put a word or phrase in quotation marks, the results will show results will show the opinions that have exactly the same words in same words in the same order as those in quotes. Only use quotation marks if you are looking for a particular word or phrase, otherwise you or phrase, otherwise you will probably exclude many results that otherwise you will probably exclude many results that could have been useful.',
    description: 'Usage guide first paragraph comment',
    id: 'components.UsageGuide.firstParagraphComment',
  },
});

export const UsageGuide: React.FC = () => {
  const [showUsageModal, setShowUsageModal] = useState<boolean>(false);
  const intl = useIntl();

  const toggleUsageModal = () => {
    setShowUsageModal((prevState) => !prevState);
  };

  const { ref } = useClickOutside({
    onClick: () => {
      setShowUsageModal(false);
    },
  });

  return (
    <div className="relative">
      <button
        className={`button text-s text-gray-500 underline button-superfit`}
        onClick={() => toggleUsageModal()}
      >
        <FormattedMessage {...messages.buttonText} />
      </button>
      <div
        ref={ref}
        className={`absolute w-400 z-30 bg-white rounded-sm border border-gray-300 shadow-l p-2 ${
          showUsageModal ? 'block' : 'hidden'
        }`}
      >
        <p className="flex justify-center text-s mb-2">
          <FormattedMessage {...messages.mainTitle} />
        </p>
        <p className="text-s">
          {ReactHtmlParser(intl.formatMessage(messages.introduction))}
        </p>
        <h3 className="mb-2">
          <FormattedMessage {...messages.title} />
        </h3>
        <p className="text-s">
          {ReactHtmlParser(intl.formatMessage(messages.firstParagraph))}
        </p>
        <p className="text-xs italic">
          <FormattedMessage {...messages.firstParagraphComment} />
        </p>
        <p className="text-s mt-2">
          {ReactHtmlParser(intl.formatMessage(messages.secondParagraph))}
        </p>
        <p className="text-s mt-2">
          <FormattedMessage {...messages.documentationText} />
          <a
            className="underline"
            target="_blank"
            href=" https://documentation.partaj.beta.gouv.fr/base-de-connaissance"
          >
            <FormattedMessage {...messages.documentationLink} />
          </a>
        </p>
      </div>
    </div>
  );
};
