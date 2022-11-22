import { AutosuggestProps } from 'react-autosuggest';
import { MessageDescriptor } from 'react-intl';

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
  due_date_after: string;
  due_date_before: string;
  [FilterColumns.STATE]: types.ReferralState[];
  [FilterColumns.UNIT]: string[];
  [FilterColumns.USER]: string[];
  [FilterColumns.USER_UNIT_NAME]: string[];
  [FilterColumns.TOPIC]: string[];
  query: string;
}>;

export type Suggestion =
  | {
      column: FilterColumns.TOPIC;
      kind: 'topiclites';
      value: types.TopicLite;
    }
  | {
      column: FilterColumns.UNIT;
      kind: 'unitlites';
      value: types.UnitLite;
    }
  | {
      column: FilterColumns.ASSIGNEE | FilterColumns.USER;
      kind: 'userlites';
      value: types.UserLite;
    };

export type SuggestionSection = {
  title: MessageDescriptor;
  values: Suggestion[];
};

export type QueryAutosuggestProps = AutosuggestProps<
  Suggestion,
  SuggestionSection
>;
