import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

import { fetchList, FetchListQueryParams } from './fetchList';
import { Note } from '../types';
import {createOne} from "./createOne";

type UseNoteActionSearchParams = {
  query: string;
};

export type UseNoteActionParams = UseNoteActionSearchParams;

type UseNoteActionOptions = UseMutationOptions<
  NoteActionResponse,
  unknown,
  UseNoteActionParams
>;

export const useNoteLitesAction = (options?: UseNoteActionOptions) => {
  const queryClient = useQueryClient();

  return useMutation<NoteActionResponse, unknown, UseNoteActionParams>(
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
  return useMutation<any, unknown, any>(
    () => filterNotesLitesAction(),
    {
      onSuccess: (data, variables, context) => {
        console.log("ON SUCCESS")
        console.log(data)
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

type NoteActionResponse = {
  results: {
    hits: {
      hits: Array<Note>;
    };
  };
};

export const notesLitesAction = (params: UseNoteActionParams) => {
  return fetchList({
    queryKey: ['noteslites', params as FetchListQueryParams],
  });
};

export const filterNotesLitesAction = () => {
  return createOne({
    name: 'noteslites/filters',
    payload: {}
  });
};
