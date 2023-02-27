import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

import { fetchList, FetchListQueryParams } from './fetchList';
import { Note, NoteLite } from '../types';
import { createOne } from './createOne';
import { fetchOne } from './fetchOne';

// Details
type UseNoteDetailsActionOptions = UseMutationOptions<
  NoteDetailsActionResponse,
  unknown,
  UseNoteDetailsActionParams
>;

type NoteDetailsActionResponse = Note;
type UseNoteDetailsActionParams = { id: string };

export const useNoteDetailsAction = (options?: UseNoteDetailsActionOptions) => {
  const queryClient = useQueryClient();

  return useMutation<
    NoteDetailsActionResponse,
    unknown,
    UseNoteDetailsActionParams
  >(({ id }) => noteDetailsAction({ id }), {
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries('notes');
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

// List
type UseNoteListActionOptions = UseMutationOptions<
  NoteListActionResponse,
  unknown,
  UseNoteListActionParams
>;
type NoteListActionResponse = {
  results: {
    hits: {
      hits: Array<NoteLite>;
    };
  };
};
type UseNoteListActionParams = {
  query: string;
};

export const useNoteLitesAction = (options?: UseNoteListActionOptions) => {
  const queryClient = useQueryClient();

  return useMutation<NoteListActionResponse, unknown, UseNoteListActionParams>(
    ({ query }) => notesLitesAction({ query }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('notes');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

export const useFilterNoteLitesAction = (options?: UseMutationOptions) => {
  return useMutation<any, unknown, any>(() => filterNotesLitesAction(), {
    onSuccess: (data, variables, context) => {
      console.log('ON SUCCESS');
      console.log(data);
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

export const noteDetailsAction = (params: UseNoteDetailsActionParams) => {
  return fetchOne({ queryKey: ['notes', params.id] });
};

export const notesLitesAction = (params: UseNoteListActionParams) => {
  return fetchList({
    queryKey: ['noteslites', params as FetchListQueryParams],
  });
};

export const filterNotesLitesAction = () => {
  return createOne({
    name: 'noteslites/filters',
    payload: {},
  });
};
