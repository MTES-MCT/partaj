import React from 'react';
import { SearchIcon } from '../Icons';

export const SearchNoteButton = () => {
  return (
    <button
      type="submit"
      aria-label="Lancer la recherche"
      className="absolute right-0 top-0 bottom-0 base-btn bg-primary-1000 inner-icon-white px-6 rounded-full shadow-l"
    >
      <SearchIcon className="w-6 h-6 fill-white" />
    </button>
  );
};
