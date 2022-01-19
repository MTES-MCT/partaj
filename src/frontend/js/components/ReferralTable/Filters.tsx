import { defineMessages } from '@formatjs/intl';
import React, { Dispatch, Fragment, SetStateAction, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { DropdownOpenButton, useDropdownMenu } from 'components/DropdownMenu';
import { AutocompleteUnitField } from 'components/AutocompleteUnitField';
import { AutocompleteUserField } from 'components/AutocompleteUserField';
import { DateRangePickerField } from 'components/DateRangePickerField';
import * as types from 'types';
import { Nullable } from 'types/utils';
import { referralStateMessages } from 'utils/sharedMessages';
import { getUserFullname } from 'utils/user';

export enum FilterColumns {
  ASSIGNEE = 'assignee',
  DUE_DATE = 'due_date',
  STATE = 'state',
  UNIT = 'unit',
  USER = 'user',
}

type FormValue =
  | types.UserLite
  | types.Unit
  | types.ReferralState
  | {
      due_date_after: Date;
      due_date_before: Date;
    };

export type FiltersDict = Partial<{
  [FilterColumns.ASSIGNEE]: types.UserLite[];
  [FilterColumns.DUE_DATE]: {
    due_date_after: Date;
    due_date_before: Date;
  };
  [FilterColumns.STATE]: types.ReferralState[];
  [FilterColumns.UNIT]: types.Unit[];
  [FilterColumns.USER]: types.UserLite[];
}>;

const messages = defineMessages({
  addFilter: {
    defaultMessage: 'Add filter',
    description:
      'Text for the button to add a filter in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.Filters.addFilter',
  },
  column: {
    defaultMessage: 'Column',
    description:
      'Label for the column field in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.Filters.column',
  },
  dueDateFilter: {
    defaultMessage:
      'Between {due_date_after, date, short} and {due_date_before , date, short}',
    description: 'Text for the filter label for due date filtering.',
    id: 'components.ReferralTable.Filters.dueDateFilter',
  },
  filter: {
    defaultMessage: 'Filter',
    description:
      'Title for the button to open the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.Filters.filter',
  },
  removeFilter: {
    defaultMessage: 'Remove filter',
    description:
      'Accessible title for the button to remove the related filter.',
    id: 'components.ReferralTable.Filters.removeFilter',
  },
  value: {
    defaultMessage: 'Value',
    description:
      'Label for the value field in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.Filters.value',
  },
  [FilterColumns.ASSIGNEE]: {
    defaultMessage: 'Assignee',
    description:
      'Name for the column filter for assignee in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.Filters.columnAssignee',
  },
  [FilterColumns.DUE_DATE]: {
    defaultMessage: 'Due date',
    description:
      'Name for the column filter for due date in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.Filters.columnDueDate',
  },
  [FilterColumns.STATE]: {
    defaultMessage: 'State',
    description:
      'Name for the column filter for state in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.Filters.columnState',
  },
  [FilterColumns.UNIT]: {
    defaultMessage: 'Unit',
    description:
      'Name for the column filter for unit in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.Filters.columnUnit',
  },
  [FilterColumns.USER]: {
    defaultMessage: 'User',
    description:
      'Name for the column filter for user in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.Filters.columnUser',
  },
});

interface FiltersProps {
  disabledColumns?: FilterColumns[];
  filters: FiltersDict;
  setFilters: Dispatch<SetStateAction<FiltersDict>>;
}

export const Filters = ({
  disabledColumns = [],
  filters,
  setFilters,
}: FiltersProps) => {
  const intl = useIntl();
  const seed = useUIDSeed();
  const dropdown = useDropdownMenu();

  // The selected column and value in the dropdown filter form
  const [formColumn, setFormColumn] = useState<FilterColumns>(
    FilterColumns.ASSIGNEE,
  );
  const [formValue, setFormValue] = useState<Nullable<FormValue>>(null);

  return (
    <div className="flex flex-row mb-4 space-x-4" style={{ width: '60rem' }}>
      <div {...dropdown.getContainerProps({ className: 'self-center' })}>
        <DropdownOpenButton {...dropdown.getDropdownButtonProps()}>
          <FormattedMessage {...messages.filter} />
        </DropdownOpenButton>
        {dropdown.getDropdownContainer(
          <div className="p-4">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();

                if (!formColumn || !formValue) {
                  return;
                }

                // Update the filters with the value from the form
                if (formColumn === FilterColumns.DUE_DATE) {
                  setFilters((existingFilters) => ({
                    ...existingFilters,
                    [FilterColumns.DUE_DATE]: formValue as FiltersDict[FilterColumns.DUE_DATE],
                  }));
                } else if (formColumn === FilterColumns.STATE) {
                  const value = formValue as types.ReferralState;
                  setFilters((existingFilters) => {
                    const existingList = existingFilters[formColumn];
                    if (!existingList) {
                      return {
                        ...existingFilters,
                        [FilterColumns.STATE]: [value],
                      };
                    }
                    if (existingList.includes(value)) {
                      return existingFilters;
                    }
                    return {
                      ...existingFilters,
                      [FilterColumns.STATE]: [...existingList, value],
                    };
                  });
                } else {
                  const value = formValue as types.Unit | types.UserLite;
                  setFilters((existingFilters) => {
                    const existingList = existingFilters[formColumn];
                    if (!existingList) {
                      return { ...existingFilters, [formColumn]: [value] };
                    }
                    if (
                      existingList.map((item) => item.id).includes(value.id)
                    ) {
                      return existingFilters;
                    }
                    return {
                      ...existingFilters,
                      [formColumn]: [...existingList, value],
                    };
                  });
                }

                // Reset the dropdown form
                setFormColumn(FilterColumns.ASSIGNEE);
                setFormValue(null);
                dropdown.setShowDropdown(false);
              }}
            >
              <label
                className="block font-semibold space-y-2"
                htmlFor={seed('referral-table-filters-add-column')}
              >
                <div>
                  <FormattedMessage {...messages.column} />
                </div>
                <select
                  className="form-control"
                  style={{
                    paddingLeft: '0.4rem' /* Fix input alignment with select */,
                  }}
                  id={seed('referral-table-filters-add-column')}
                  name="column"
                  required={true}
                  onChange={(e) => {
                    setFormColumn(e.target.value as FilterColumns);
                    // Value must be reset when the column is changed to make sure we don't carry over
                    // a value that is related to another column
                    if (e.target.value === FilterColumns.STATE) {
                      // As it is a select, state column must be initialized with a value
                      setFormValue(types.ReferralState.ANSWERED);
                    } else {
                      setFormValue(null);
                    }
                  }}
                >
                  {Object.values(FilterColumns)
                    .filter((column) => !disabledColumns.includes(column))
                    .map((column) => (
                      <option key={column} value={column}>
                        {intl.formatMessage(messages[column])}
                      </option>
                    ))}
                </select>
              </label>

              <label
                className="block font-semibold space-y-2"
                htmlFor={seed('referral-table-filters-add-value')}
              >
                <div>
                  <FormattedMessage {...messages.value} />
                </div>
                {[FilterColumns.ASSIGNEE, FilterColumns.USER].includes(
                  formColumn,
                ) ? (
                  <AutocompleteUserField
                    inputProps={{
                      id: seed('referral-table-filters-add-value'),
                    }}
                    onSuggestionSelected={(suggestion) =>
                      setFormValue(suggestion)
                    }
                  />
                ) : null}
                {formColumn === FilterColumns.STATE ? (
                  <select
                    className="form-control"
                    style={{
                      paddingLeft:
                        '0.4rem' /* Fix input alignment with select */,
                    }}
                    id={seed('referral-table-filters-add-value')}
                    name="value"
                    onChange={(e) => {
                      setFormValue(e.target.value as types.ReferralState);
                    }}
                  >
                    {Object.values(types.ReferralState)
                      .filter((state) => state !== types.ReferralState.DRAFT)
                      .map((state) => (
                        <option key={state} value={state}>
                          {intl.formatMessage(referralStateMessages[state])}
                        </option>
                      ))}
                  </select>
                ) : null}
                {formColumn === FilterColumns.UNIT ? (
                  <AutocompleteUnitField
                    inputProps={{
                      id: seed('referral-table-filters-add-value'),
                    }}
                    onSuggestionSelected={(suggestion) =>
                      setFormValue(suggestion)
                    }
                  />
                ) : null}
                {formColumn === FilterColumns.DUE_DATE ? (
                  <DateRangePickerField
                    onSelectRange={(from, to) =>
                      setFormValue({
                        due_date_after: from,
                        due_date_before: to,
                      })
                    }
                  />
                ) : null}
              </label>
              <button type="submit" className="btn btn-primary flex">
                <FormattedMessage {...messages.addFilter} />
              </button>
            </form>
          </div>,
          {
            className: 'border overflow-visible',
            style: { width: '20rem', zIndex: 1 },
          },
          'right',
        )}
      </div>
      <div className="flex flex-row items-center flex-wrap gap-2">
        {filters[FilterColumns.DUE_DATE] ? (
          <div className="tag tag-blue">
            <FormattedMessage {...messages[FilterColumns.DUE_DATE]} />:{' '}
            <FormattedMessage
              {...messages.dueDateFilter}
              values={filters[FilterColumns.DUE_DATE]}
            />
            <button
              onClick={() =>
                setFilters((existingFilters) => ({
                  ...existingFilters,
                  [FilterColumns.DUE_DATE]: undefined,
                }))
              }
              aria-labelledby={seed(FilterColumns.DUE_DATE)}
            >
              <svg role="img" className="w-5 h-5 -mr-2 fill-current">
                <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
                <title id={seed(FilterColumns.DUE_DATE)}>
                  <FormattedMessage {...messages.removeFilter} />
                </title>
              </svg>
            </button>
          </div>
        ) : null}

        {filters[FilterColumns.STATE] ? (
          <Fragment>
            {filters[FilterColumns.STATE]!.map((state) => (
              <div className="tag tag-blue" key={state}>
                <FormattedMessage {...messages[FilterColumns.STATE]} />:{' '}
                <FormattedMessage {...referralStateMessages[state]} />
                <button
                  onClick={() =>
                    setFilters((existingFilters) => ({
                      ...existingFilters,
                      [FilterColumns.STATE]:
                        existingFilters[FilterColumns.STATE]!.length === 1
                          ? undefined
                          : existingFilters[FilterColumns.STATE]!.filter(
                              (selectedState) => selectedState !== state,
                            ),
                    }))
                  }
                  aria-labelledby={seed(`${FilterColumns.STATE} - ${state}`)}
                >
                  <svg role="img" className="w-5 h-5 -mr-2 fill-current">
                    <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
                    <title id={seed(`${FilterColumns.STATE} - ${state}`)}>
                      <FormattedMessage {...messages.removeFilter} />
                    </title>
                  </svg>
                </button>
              </div>
            ))}
          </Fragment>
        ) : null}

        {filters[FilterColumns.USER] ? (
          <Fragment>
            {filters[FilterColumns.USER]!.map((user) => (
              <div className="tag tag-blue" key={user.id}>
                <FormattedMessage {...messages[FilterColumns.USER]} />:{' '}
                {getUserFullname(user)}
                <button
                  onClick={() =>
                    setFilters((existingFilters) => ({
                      ...existingFilters,
                      [FilterColumns.USER]:
                        existingFilters[FilterColumns.USER]!.length === 1
                          ? undefined
                          : existingFilters[FilterColumns.USER]!.filter(
                              (selectedUser) => selectedUser.id !== user.id,
                            ),
                    }))
                  }
                  aria-labelledby={seed(`${FilterColumns.USER} - ${user.id}}`)}
                >
                  <svg role="img" className="w-5 h-5 -mr-2 fill-current">
                    <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
                    <title id={seed(`${FilterColumns.USER} - ${user.id}`)}>
                      <FormattedMessage {...messages.removeFilter} />
                    </title>
                  </svg>
                </button>
              </div>
            ))}
          </Fragment>
        ) : null}

        {filters[FilterColumns.ASSIGNEE] ? (
          <Fragment>
            {filters[FilterColumns.ASSIGNEE]!.map((user) => (
              <div className="tag tag-blue" key={user.id}>
                <FormattedMessage {...messages[FilterColumns.ASSIGNEE]} />:{' '}
                {getUserFullname(user)}
                <button
                  onClick={() =>
                    setFilters((existingFilters) => ({
                      ...existingFilters,
                      [FilterColumns.ASSIGNEE]:
                        existingFilters[FilterColumns.ASSIGNEE]!.length === 1
                          ? undefined
                          : existingFilters[FilterColumns.ASSIGNEE]!.filter(
                              (selectedUser) => selectedUser.id !== user.id,
                            ),
                    }))
                  }
                  aria-labelledby={seed(
                    `${FilterColumns.ASSIGNEE} - ${user.id}}`,
                  )}
                >
                  <svg role="img" className="w-5 h-5 -mr-2 fill-current">
                    <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
                    <title id={seed(`${FilterColumns.ASSIGNEE} - ${user.id}`)}>
                      <FormattedMessage {...messages.removeFilter} />
                    </title>
                  </svg>
                </button>
              </div>
            ))}
          </Fragment>
        ) : null}

        {filters[FilterColumns.UNIT] ? (
          <Fragment>
            {filters[FilterColumns.UNIT]!.map((unit) => (
              <div className="tag tag-blue" key={unit.id}>
                <FormattedMessage {...messages[FilterColumns.UNIT]} />:{' '}
                {unit.name}
                <button
                  onClick={() =>
                    setFilters((existingFilters) => ({
                      ...existingFilters,
                      [FilterColumns.UNIT]:
                        existingFilters[FilterColumns.UNIT]!.length === 1
                          ? undefined
                          : existingFilters[FilterColumns.UNIT]!.filter(
                              (selectedUnit) => selectedUnit.id !== unit.id,
                            ),
                    }))
                  }
                  aria-labelledby={seed(`${FilterColumns.UNIT} - ${unit.id}}`)}
                >
                  <svg role="img" className="w-5 h-5 -mr-2 fill-current">
                    <use xlinkHref={`${appData.assets.icons}#icon-cross`} />
                    <title id={seed(`${FilterColumns.UNIT} - ${unit.id}`)}>
                      <FormattedMessage {...messages.removeFilter} />
                    </title>
                  </svg>
                </button>
              </div>
            ))}
          </Fragment>
        ) : null}
      </div>
    </div>
  );
};
