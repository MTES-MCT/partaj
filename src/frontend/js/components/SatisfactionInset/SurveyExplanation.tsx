import React, { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useClickOutside } from '../../utils/useClickOutside';

const messages = defineMessages({
  buttonText: {
    defaultMessage: 'what do we do with this questionnaire?',
    description: 'Usage guide button title',
    id: 'components.SurveyExplanation.buttonText',
  },
  message: {
    defaultMessage:
      'All responses are collected anonymously and used for statistical purposes to gather an overall satisfaction rating and improve the experience of Partaj users.',
    description: 'Survey explanation',
    id: 'components.SurveyExplanation.message',
  },
});

export const SurveyExplanation: React.FC = () => {
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
        className={`italic button text-s text-gray-500 underline button-superfit`}
        onClick={() => toggleUsageModal()}
        aria-expanded={showUsageModal}
      >
        <FormattedMessage {...messages.buttonText} />
      </button>

      <div
        ref={ref}
        className={`absolute w-400 z-30 bg-white rounded-sm border border-gray-300 shadow-l p-2 ${
          showUsageModal ? 'block' : 'hidden'
        }`}
      >
        <p className="flex text-s mb-2">
          <FormattedMessage {...messages.message} />
        </p>
      </div>
    </div>
  );
};
