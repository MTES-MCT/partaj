import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

import { fetchList, FetchListQueryParams } from './fetchList';
import { Note, NoteLite } from '../types';
import { createOne } from './createOne';
import { fetchOne } from './fetchOne';
import { NoteFilters } from '../components/Notes/NoteListView';

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

type UseSubFilterNoteListActionOptions = UseMutationOptions<
  any,
  unknown,
  UseSubFiltersNoteLitesActionParams
>;

type NoteListActionResponse = {
  results: {
    hits: {
      hits: Array<NoteLite>;
    };
  };
};
type UseNoteListActionParams = NoteFilters & {
  query: string;
};

type UseSubFiltersNoteLitesActionParams = {
  filter: string;
  query: string;
};

export const useNoteLitesAction = (options?: UseNoteListActionOptions) => {
  const queryClient = useQueryClient();

  return useMutation<NoteListActionResponse, unknown, UseNoteListActionParams>(
    ({ query, topic, requesters_unit_names, assigned_units_names, author }) =>
      notesLitesAction({
        query,
        topic,
        requesters_unit_names,
        assigned_units_names,
        author,
      }),
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

export const useFiltersNoteLitesAction = (
  options?: UseSubFilterNoteListActionOptions,
) => {
  return useMutation<any, unknown, any>(() => filtersNotesLitesAction(), {
    onSuccess: (data, variables, context) => {
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

export const filtersNotesLitesAction = () => {
  return createOne({
    name: 'noteslites/filters',
    payload: {},
  });
};
