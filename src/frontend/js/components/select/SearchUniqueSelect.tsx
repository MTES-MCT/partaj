import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { ChevronBottomIcon, SearchIcon } from '../Icons';
import { commonMessages } from '../../const/translations';
import { SelectableList, SelectOption } from './SelectableList';
import { SelectButton } from './SelectButton';
import { SelectModal } from './SelectModal';
import { Topic } from '../../types';
import { SelectModalProvider } from '../../data/providers/SelectModalProvider';
import { stringContainsText } from '../../utils/string';

interface SearchUniqueSelectProps {
  identifier: string;
  options: Array<SelectOption>;
  onOptionClick: Function;
  activeOption: SelectOption;
  getItemAttributes: Function;
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
  getItemAttributes,
  activeOption,
  identifier,
  hasError,
}: SearchUniqueSelectProps) => {
  const intl = useIntl();
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const searchInputRef = useRef(null);
  const [currentOptions, setCurrentOptions] = useState<Array<SelectOption>>(
    options,
  );

  const closeModal = () => {
    setIsOptionsOpen(false);
    (searchInputRef.current! as HTMLElement).blur();
    setSearchText('');
  };

  const toggleOptions = () => {
    setIsOptionsOpen((prevState) => !prevState);
  };

  const filterResults = (value: string) => {
    return options.filter((option) => {
      return stringContainsText(option.name, value);
    });
  };

  useEffect(() => {
    setCurrentOptions(filterResults(searchText));
  }, [searchText]);

  useEffect(() => {
    setCurrentOptions(options);
  }, [options]);

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
        isDisabled={options.length === 0}
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
        currentOptions={currentOptions}
        onSelect={(value: string) => {
          onOptionClick(value);
          closeModal();
        }}
      >
        <SelectModal isOptionsOpen={isOptionsOpen}>
          <div className="dsfr-search p-1 w-full">
            <div className="absolute left-2">
              <SearchIcon className="fill-grey600" />
            </div>
            <input
              className="pl-8 pr-1"
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
          {currentOptions.length > 0 ? (
            <SelectableList
              label={intl.formatMessage(messages.selectDefaultText)}
              itemContent={(option: Topic) => (
                <div
                  className={`flex space-x-2 ${
                    getItemAttributes?.(option).cssClass
                  }`}
                >
                  {getItemAttributes?.(option).icon && (
                    <div>{getItemAttributes?.(option).icon}</div>
                  )}
                  <div className="space-y-2">
                    <p className="text-black text-sm font-medium">
                      {option.name}
                    </p>
                    <p className="text-grey-900 text-sm">{option.unit_name}</p>
                  </div>
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
