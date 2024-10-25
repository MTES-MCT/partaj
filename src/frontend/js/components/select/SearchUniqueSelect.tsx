import React, { useContext, useEffect, useRef, useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { ChevronBottomIcon, SearchIcon } from '../Icons';
import { commonMessages } from '../../const/translations';
import { SelectableList, SelectOption } from './SelectableList';
import { SelectButton } from './SelectButton';
import { SelectModal } from './SelectModal';
import { Topic } from '../../types';
import {
  SelectModalContext,
  SelectModalProvider,
} from '../../data/providers/SelectModalProvider';

interface SearchUniqueSelectProps {
  identifier: string;
  options: Array<SelectOption>;
  onSearchChange: Function;
  onOptionClick: Function;
  activeOption: SelectOption;
  getOptionClass: Function;
  hasError: boolean;
}

const messages = defineMessages({
  search: {
    defaultMessage: 'Search',
    description: 'Search in the different values of the selector',
    id: 'components.SearchMultiSelect.search',
  },
  selectDefaultText: {
    defaultMessage: 'SelectableList a topic',
    description: 'Default text for topic select',
    id: 'components.SearchMultiSelect.selectDefaultText',
  },
});

export const SearchUniqueSelect = ({
  options,
  onOptionClick,
  onSearchChange,
  getOptionClass,
  activeOption,
  identifier,
  hasError,
}: SearchUniqueSelectProps) => {
  const intl = useIntl();
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const searchInputRef = useRef(null);

  const closeModal = () => {
    setIsOptionsOpen(false);
    (searchInputRef.current! as HTMLElement).blur();
    setSearchText('');
  };

  const toggleOptions = () => {
    setIsOptionsOpen((prevState) => !prevState);
  };

  useEffect(() => {
    onSearchChange(searchText);
  }, [searchText]);

  useEffect(() => {
    if (isOptionsOpen) {
      searchInputRef.current && (searchInputRef.current as HTMLElement).focus();
    } else {
      searchInputRef.current && (searchInputRef.current as HTMLElement).blur();
    }
  }, [isOptionsOpen]);

  return (
    <div className="flex flex-col relative" tabIndex={-1}>
      <SelectButton
        isOptionsOpen={isOptionsOpen}
        onClick={() => toggleOptions()}
        hasError={hasError}
      >
        <span className="px-2 mb-0.5">
          {activeOption ? (
            activeOption.name
          ) : (
            <FormattedMessage {...messages.selectDefaultText} />
          )}
        </span>
        <ChevronBottomIcon className="fill-black shrink-0" />
      </SelectButton>
      <SelectModalProvider
        closeModal={() => closeModal()}
        onSelect={(value: string) => onOptionClick(value)}
        currentOptions={options}
      >
        <SelectModal isOptionsOpen={isOptionsOpen}>
          <div className="dsfr-search p-1">
            <div className="absolute left-2">
              <SearchIcon className="fill-grey600" />
            </div>
            <input
              type="search"
              name={identifier + '-filter-search-input'}
              ref={searchInputRef}
              title={intl.formatMessage(messages.search)}
              placeholder={intl.formatMessage(messages.search)}
              aria-label="auto-search-filter"
              aria-autocomplete="list"
              aria-describedby={identifier + '-search-input-description'}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
              }}
            />
            <p
              id={identifier + '-search-input-description'}
              className="sr-only"
            >
              <FormattedMessage {...commonMessages.accessibilitySelect} />
            </p>
          </div>
          {options.length > 0 ? (
            <SelectableList
              label={intl.formatMessage(messages.selectDefaultText)}
              onOptionClick={(id: string) => {
                onOptionClick(id);
                closeModal();
              }}
              itemContent={(option: Topic) => (
                <div className={`flex flex-col ${getOptionClass?.(option)}`}>
                  <p>{option.name}</p>
                  <p>{option.unit_name}</p>
                </div>
              )}
            />
          ) : (
            <div className="flex items-center justify-center min-h-48">
              <span className="text-sm "> Aucun résultat</span>
            </div>
          )}
        </SelectModal>
      </SelectModalProvider>
    </div>
  );
};
