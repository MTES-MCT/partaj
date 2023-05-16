import { defineMessages } from '@formatjs/intl';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { DropdownOpenButton, useDropdownMenu } from 'components/DropdownMenu';
import { AutocompleteUnitField } from 'components/AutocompleteUnitField';
import { AutocompleteUserUnitName } from 'components/AutocompleteUserUnitName';
import { AutocompleteUserField } from 'components/AutocompleteUserField';
import { DateRangePickerField } from 'components/DateRangePickerField';
import { AutocompleteTopicField } from 'components/AutocompleteTopicField';
import * as types from 'types';
import { Nullable } from 'types/utils';
import { referralStateMessages } from 'utils/sharedMessages';
import { EnabledFiltersList } from './EnabledFiltersList';
import { QueryInput } from './Input';
import { sharedMessages } from './sharedMessages';
import { FilterColumns, FiltersDict } from './types';

type FormValue =
  | types.UserLite
  | types.Unit
  | types.Topic
  | types.ReferralState
  | {
      due_date_after: Date;
      due_date_before: Date;
    };

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
  filter: {
    defaultMessage: 'Filter',
    description:
      'Title for the button to open the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.Filters.filter',
  },
  value: {
    defaultMessage: 'Value',
    description:
      'Label for the value field in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.Filters.value',
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

  const handleSubmit = () => {
    if (!formColumn || !formValue) {
      return;
    }

    // Update the filters with the value from the form
    if (formColumn === FilterColumns.DUE_DATE) {
      const { due_date_after, due_date_before } = formValue as {
        due_date_after: Date;
        due_date_before: Date;
      };

      setFilters((existingFilters) => ({
        ...existingFilters,
        [FilterColumns.DUE_DATE]: {
          due_date_after: due_date_after.toISOString().substring(0, 10),
          due_date_before: due_date_before.toISOString().substring(0, 10),
        },
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
    } else if (formColumn === FilterColumns.USER) {
      const value = formValue as types.UserLite;
      setFilters((existingFilters) => {
        const existingList = existingFilters[formColumn];
        if (!existingList) {
          return { ...existingFilters, [formColumn]: [value.id] };
        }
        if (existingList.includes(value.id)) {
          return existingFilters;
        }
        return {
          ...existingFilters,
          [formColumn]: [...existingList, value.id],
        };
      });
    } else if (formColumn === FilterColumns.USER_UNIT_NAME) {
      const value = formValue as types.UserLite;
      setFilters((existingFilters) => {
        const existingList = existingFilters[formColumn] || [];
        if (existingList.includes(value.id)) {
          return existingFilters;
        }
        return {
          ...existingFilters,
          [formColumn]: [...existingList, value.unit_name],
        };
      });
    } else {
      const value = formValue as types.Unit | types.UserLite | types.Topic;
      setFilters((existingFilters) => {
        const existingList = existingFilters[formColumn];
        if (!existingList) {
          return { ...existingFilters, [formColumn]: [value.id] };
        }
        if (existingList.includes(value.id)) {
          return existingFilters;
        }
        return {
          ...existingFilters,
          [formColumn]: [...existingList, value.id],
        };
      });
    }
  };

  return (
    <div className="flex flex-row mb-4 space-x-4" style={{ width: '60rem' }}>
      <QueryInput setFilters={setFilters} />
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
                handleSubmit();
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
                        {intl.formatMessage(sharedMessages[column])}
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

                {formColumn === FilterColumns.ASSIGNEE ? (
                  <AutocompleteUserField
                    inputProps={{
                      id: seed('referral-table-filters-add-value'),
                    }}
                    onSuggestionSelected={(suggestion) =>
                      setFormValue(suggestion)
                    }
                  />
                ) : null}

                {formColumn === FilterColumns.USER_UNIT_NAME ? (
                  <AutocompleteUserUnitName
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
                {formColumn === FilterColumns.USER ? (
                  <AutocompleteUserField
                    inputProps={{
                      id: seed('referral-table-filters-add-value'),
                    }}
                    onSuggestionSelected={(suggestion) =>
                      setFormValue(suggestion)
                    }
                  />
                ) : null}

                {formColumn === FilterColumns.TOPIC ? (
                  <AutocompleteTopicField
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
      <EnabledFiltersList filters={filters} setFilters={setFilters} />
    </div>
  );
};
