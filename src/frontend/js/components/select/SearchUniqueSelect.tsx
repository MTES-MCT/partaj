import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useClickOutside } from '../../utils/useClickOutside';
import { ChevronBottomIcon, SearchIcon } from '../Icons';
import { commonMessages } from '../../const/translations';
import { SelectableList, SelectOption } from './SelectableList';
import { SelectButton } from './SelectButton';
import { SelectModal } from './SelectModal';

interface SearchUniqueSelectProps {
  identifier: string;
  options: Array<SelectOption>;
  onSearchChange: Function;
  onOptionClick: Function;
  activeOption: SelectOption;
  getOptionClass: Function;
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
}: SearchUniqueSelectProps) => {
  const intl = useIntl();
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<number>(0);

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

  useEffect(() => {
    if (options.length > 0) {
      setSelectedOption(0);
    }
  }, [options]);

  return (
    <>
      <div className="flex flex-col relative" tabIndex={-1}>
        <SelectButton
          isOptionsOpen={isOptionsOpen}
          onClick={() => toggleOptions()}
        >
          <span className="px-2 mb-0.5">
            {activeOption ? (
              activeOption.name
            ) : (
              <FormattedMessage {...messages.selectDefaultText} />
            )}
          </span>
          <ChevronBottomIcon className="fill-black" />
        </SelectButton>
        <SelectModal
          isOptionsOpen={isOptionsOpen}
          onClickOutside={() => closeModal()}
          onKeyDown={{
            Enter: () => {
              onOptionClick(options[selectedOption].id);
              closeModal();
            },
            ArrowUp: () => {
              options.length > 0 &&
                setSelectedOption((prevState) => {
                  return prevState - 1 >= 0
                    ? prevState - 1
                    : options.length - 1;
                });
            },
            ArrowDown: () => {
              options.length > 0 &&
                setSelectedOption((prevState) => {
                  return prevState == options.length - 1 ? 0 : prevState + 1;
                });
            },
            Close: () => {
              closeModal();
            },
          }}
        >
          <div className="dsfr-search">
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

          <div className="flex items-center justify-center">
            {options.length > 0 ? (
              <SelectableList
                label={intl.formatMessage(messages.selectDefaultText)}
                options={options}
                onOptionClick={(id: string) => {
                  onOptionClick(id);
                  closeModal();
                }}
                closeModal={() => {
                  setIsOptionsOpen(false);
                }}
                getOptionClass={getOptionClass}
                selectedOption={selectedOption}
              />
            ) : (
              <div className="flex items-center justify-center min-h-48">
                <span className="text-sm "> Aucun résultat</span>
              </div>
            )}
          </div>
        </SelectModal>
      </div>
    </>
  );
};
