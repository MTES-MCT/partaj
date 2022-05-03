import { AutosuggestProps } from 'react-autosuggest';

import * as types from 'types';

export enum FilterColumns {
  ASSIGNEE = 'assignee',
  DUE_DATE = 'due_date',
  STATE = 'state',
  UNIT = 'unit',
  USER = 'user',
  USER_UNIT_NAME = 'users_unit_name',
  TOPIC = 'topic',
}

export type FiltersDict = Partial<{
  [FilterColumns.ASSIGNEE]: string[];
  [FilterColumns.DUE_DATE]: {
    due_date_after: string;
    due_date_before: string;
  };
  [FilterColumns.STATE]: types.ReferralState[];
  [FilterColumns.UNIT]: string[];
  [FilterColumns.USER_UNIT_NAME]: string[];
  [FilterColumns.TOPIC]: string[];
  query: string;
}>;

export type Suggestion = { title: string };

export type SuggestionSection = { title: string };

export type QueryAutosuggestProps = AutosuggestProps<
  Suggestion,
  SuggestionSection
>;
