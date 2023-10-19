import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { SearchIcon } from '../Icons';

const messages = defineMessages({
  label: {
    defaultMessage: 'Start note search',
    description: 'Accessibility label for the search note button',
    id: 'components.buttons.SearchNoteButton.label',
  },
});

export const SearchNoteButton = () => {
  const intl = useIntl();

  return (
    <button
      type="submit"
      aria-label={intl.formatMessage(messages.label)}
      className="absolute right-0 top-0 bottom-0 base-btn bg-primary-1000 inner-icon-white px-6 rounded-full shadow-l"
    >
      <SearchIcon className="w-6 h-6 fill-white" />
    </button>
  );
};
