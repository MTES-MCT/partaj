import React, { useEffect, useState } from 'react';

import { SubmitButton } from '../buttons/SubmitButton';
import { useFilterNoteLitesAction, useNoteLitesAction } from '../../data/notes';
import { Note } from '../../types';
import { NoteItem } from './NoteItem';

export const Notes: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [notes, setNotes] = useState<Array<Note>>([]);
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
          console.log("data");
          console.log(data);
          setFilters(data.aggregations)
      }
  });

  useEffect(() => {
    console.log('coucou');
    if (filters.length === 0 && filterMutation.isIdle) {
      console.log('coucou2');
      filterMutation.mutate({});
    }
  });

  return (
    <>
      <form
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          notesMutation.mutate({
            query: inputValue,
          });
        }}
      >
        <div className="flex space-x-3 max-w-xs">
          <input
            placeholder=" Recherchez le terme"
            className={`search-input search-input-gray`}
            type="text"
            aria-label="serach-text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
          />
          <SubmitButton className="btn-sm btn-gray rounded-sm px-2">
            Rechercher
          </SubmitButton>
        </div>
      </form>
      <>
        {filterMutation.isSuccess && (
          <>
            {Object.keys(filters).map((key) => {
              return (
                <div className="flex flex-col">
                  <span>
                    <u>{key}</u>
                  </span>
                  {filters[key as any].buckets.map((filter: any) => {
                    return <span> {filter.key} </span>;
                  })}
                </div>
              );
            })}
          </>
        )}
      </>
      <>
        {notesMutation.isLoading && <> Recherche en cours...</>}
        {notesMutation.isSuccess && (
          <>{notes && notes.map((note: Note) => <NoteItem note={note} />)}</>
        )}
      </>
    </>
  );
};
