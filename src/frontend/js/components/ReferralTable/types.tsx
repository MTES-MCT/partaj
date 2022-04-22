import { AutosuggestProps } from 'react-autosuggest';

import * as types from 'types';

export enum FilterColumns {
  ASSIGNEE = 'assignee',
  DUE_DATE = 'due_date',
  STATE = 'state',
  UNIT = 'unit',
  USER_UNIT_NAME = 'users_unit_name',
  TOPIC = 'topic',
}
export type FiltersDict = Partial<{
  [FilterColumns.ASSIGNEE]: types.UserLite[];
  [FilterColumns.DUE_DATE]: {
    due_date_after: Date;
    due_date_before: Date;
  };
  [FilterColumns.STATE]: types.ReferralState[];
  [FilterColumns.UNIT]: types.Unit[];
  [FilterColumns.USER_UNIT_NAME]: types.UserLite[];
  [FilterColumns.TOPIC]: types.Topic[];
  query: string;
}>;

export type Suggestion = { title: string };

export type SuggestionSection = { title: string };

export type QueryAutosuggestProps = AutosuggestProps<
  Suggestion,
  SuggestionSection
>;
