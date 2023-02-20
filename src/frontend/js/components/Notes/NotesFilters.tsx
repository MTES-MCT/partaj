import React, { useState } from 'react';

import { SubmitButton } from '../buttons/SubmitButton';
import { useNoteLitesAction } from '../../data/notes';
import { Note } from '../../types';
import {NoteItem} from "./NoteItem";

export const Notes: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [notes, setNotes] = useState<Array<Note>>([]);

  const mutation = useNoteLitesAction({
    onSuccess: (data, variables, context) => {
      setNotes(data.results.hits.hits);
    },
    onError: (error, variables, context) => {
      console.log(error);
    },
  });

  return (
    <>
      <form
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({
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
        {mutation.isLoading && <> Rehcerche en cours...</>}
        {mutation.isSuccess && (
          <>
            {notes && notes.map((note: Note) => (
              <NoteItem note={note} />
            ))}
          </>
        )}
      </>
    </>
  );
};
