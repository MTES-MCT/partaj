import React from 'react';
import { IconColor, SearchIcon } from '../Icons';

export const SearchNoteButton = () => {
  return (
    <button
      type="submit"
      className="absolute right-0 top-0 bottom-0 base-btn bg-primary-1000 inner-icon-white px-6 rounded-full shadow-l"
    >
      <SearchIcon size={6} color={IconColor.WHITE} />
    </button>
  );
};
