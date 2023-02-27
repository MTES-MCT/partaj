import React, { useEffect, useState } from 'react';

import { useFilterNoteLitesAction, useNoteLitesAction } from '../../data/notes';
import { NoteLite } from '../../types';
import { NoteItem } from './NoteItem';
import { SearchNoteButton } from '../buttons/SearchNoteButton';

export const NotesView: React.FC = () => {
  const [isInitialized, setInitialized] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [notes, setNotes] = useState<Array<NoteLite>>([]);
  const [filters, setFilters] = useState<Array<any>>([]);

  const notesMutation = useNoteLitesAction({
    onSuccess: (data, variables, context) => {
      setNotes(data.results.hits.hits);
    },
    onError: (error, variables, context) => {
      console.log(error);
    },
  });

  const filterMutation = useFilterNoteLitesAction({
    onSuccess: (data: any) => {
      setFilters(data.aggregations);
    },
  });

  useEffect(() => {
    if (inputValue === '' && notesMutation.isIdle && !isInitialized) {
      notesMutation.mutate({ query: inputValue });
    }

    if (filters.length === 0 && filterMutation.isIdle) {
      filterMutation.mutate({});
    }
  });

  return (
    <div className="font-marianne notes relative flex flex-col overflow-auto flex-grow items-center">
      <div className="w-full flex items-center justify-center flex-col mb-10">
        <h1 className="text-primary-1000 mb-6"> Base de connaissance</h1>
        <form
          className="flex w-full max-w-480 relative"
          onSubmit={(e) => {
            e.preventDefault();
            notesMutation.mutate({
              query: inputValue,
            });
          }}
        >
          <input
            placeholder="Recherchez le terme"
            className={`note-search-input note-search-input-gray`}
            type="text"
            aria-label="search-text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
          />
          <SearchNoteButton />
        </form>
      </div>
      <div className="flex flex-grow flex-col w-full max-w-640 items-center">
        {notesMutation.isLoading && <> Recherche en cours ... </>}
        {notesMutation.isSuccess &&
          notes &&
          notes.map((note: NoteLite) => <NoteItem note={note} />)}
        {filterMutation.isSuccess && (
          <div className="hidden">
            {Object.keys(filters).map((key) => {
              return (
                <div className="flex flex-col justify-center">
                  <span>
                    <u>{key}</u>
                  </span>
                  {filters[key as any].buckets.map((filter: any) => {
                    return <span> {filter.key} </span>;
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
