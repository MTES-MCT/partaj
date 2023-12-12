import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

import { fetchList, FetchListQueryParams } from './fetchList';
import { Note, NoteLite } from '../types';
import { createOne } from './createOne';
import { fetchOne } from './fetchOne';
import { FilterKeys, NoteFilters } from '../components/Notes/NoteListView';
import { dateToString } from '../utils/date';

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
      total: { value: number };
    };
  };
  count: number;
};

type NoteListActionParams = { query: string } & {
  [key in FilterKeys]: Array<string>;
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
    ({
      query,
      topic,
      requesters_unit_names,
      assigned_units_names,
      contributors,
      publication_date_before,
      publication_date_after,
    }) => {
      return notesLitesAction({
        query,
        topic: topic.map((filter) => filter.value as string),
        requesters_unit_names: requesters_unit_names.map(
          (filter) => filter.value as string,
        ),
        assigned_units_names: assigned_units_names.map(
          (filter) => filter.value as string,
        ),
        publication_date_after: publication_date_after.map(
          (filter) => dateToString(filter.value as Date) as string,
        ),
        publication_date_before: publication_date_before.map(
          (filter) => dateToString(filter.value as Date) as string,
        ),
        contributors: contributors.map((filter) => filter.value as string),
      });
    },
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

export const noteDetailsAction = (params: UseNoteDetailsActionParams) => {
  return fetchOne({ queryKey: ['notes', params.id] });
};

export const notesLitesAction = (params: NoteListActionParams) => {
  return fetchList({
    queryKey: ['noteslites', params as FetchListQueryParams],
  });
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

export const filtersNotesLitesAction = () => {
  return createOne({
    name: 'noteslites/filters',
    payload: {},
  });
};
