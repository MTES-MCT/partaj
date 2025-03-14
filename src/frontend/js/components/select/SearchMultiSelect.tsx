import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { DOMElementPosition } from '../../types';
import { useClickOutside } from '../../utils/useClickOutside';
import { CheckIcon, ChevronBottomIcon, SearchIcon } from '../Icons';
import { stringContainsText } from '../../utils/string';
import { commonMessages } from '../../const/translations';
import { kebabCase } from 'lodash-es';

export interface Option {
  id: string;
  name: string;
}

interface SearchSelectProps {
  options: Array<Option>;
  name?: string;
  filterKey: string;
  onOptionClick: Function;
  activeOptions: Array<string>;
}

const messages = defineMessages({
  search: {
    defaultMessage: 'Search',
    description: 'Search in the different values of the selector',
    id: 'components.SearchMultiSelect.search',
  },
});

export const SearchMultiSelect = ({
  name,
  filterKey,
  options,
  onOptionClick,
  activeOptions,
}: SearchSelectProps) => {
  const intl = useIntl();

  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  const [optionList, setOptionList] = useState<Array<Option>>(options);
  const [position, setPosition] = useState<DOMElementPosition>({
    top: 0,
    left: 0,
  });

  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const openModal = (buttonRef: any) => {
    setPosition(getPosition(buttonRef));
    setIsOptionsOpen(true);
    (searchInputRef.current! as HTMLElement).focus();
  };

  const closeModal = () => {
    setIsOptionsOpen(false);
    (searchInputRef.current! as HTMLElement).blur();
    setSelectedOption(0);
    setSearchText('');
  };

  const { ref } = useClickOutside({
    onClick: () => {
      closeModal();
    },
    insideRef: listRef,
  });

  const toggleOptions = (buttonRef: any) => {
    isOptionsOpen ? closeModal() : openModal(buttonRef);
  };

  const getPosition = (buttonRef: any) => {
    return {
      top: buttonRef.current.getBoundingClientRect().top,
      left: buttonRef.current.getBoundingClientRect().left,
      marginTop: '35px',
    };
  };

  const filterResults = (value: string) => {
    return options.filter((option) => {
      return stringContainsText(option.name, value);
    });
  };

  useEffect(() => {
    setOptionList(filterResults(searchText));
  }, [searchText]);

  useEffect(() => {
    if (optionList.length > 0) {
      setSelectedOption(0);
    }
  }, [optionList]);

  const handleListKeyDown = (e: any) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onOptionClick(filterKey, optionList[selectedOption]);
        break;
      case 'ArrowUp':
        e.preventDefault();
        optionList.length > 0 &&
          setSelectedOption((prevState) => {
            return prevState - 1 >= 0 ? prevState - 1 : optionList.length - 1;
          });
        break;
      case 'ArrowDown':
        e.preventDefault();
        optionList.length > 0 &&
          setSelectedOption((prevState) => {
            return prevState == optionList.length - 1 ? 0 : prevState + 1;
          });
        break;
      case 'Esc':
      case 'Escape':
      case 27:
        e.preventDefault();
        closeModal();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (isOptionsOpen) {
      searchInputRef.current && (searchInputRef.current as HTMLElement).focus();
    } else {
      searchInputRef.current && (searchInputRef.current as HTMLElement).blur();
    }
  }, [isOptionsOpen]);

  return (
    <>
      {options.length > 0 && (
        <div className="w-fit" tabIndex={-1}>
          <button
            ref={ref}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOptionsOpen}
            className={`button space-x-1 text-s text-primary-700 px-2 py-1 border border-grey-200 ${
              isOptionsOpen ? 'bg-primary-50' : 'bg-white'
            }`}
            onClick={() => toggleOptions(ref)}
          >
            <span id={`${filterKey}-title`}>{name}</span>
            <ChevronBottomIcon className="fill-primary700" />
          </button>
          <div
            className={`${
              isOptionsOpen ? 'fixed' : 'hidden'
            } 'bg-transparent inset-0  z-19 flex justify-center items-center`}
            style={{ margin: 0 }}
          ></div>
          <div
            onKeyDown={handleListKeyDown}
            ref={listRef}
            style={{ ...position, zIndex: 20 }}
            className={`fixed list-none shadow-modal bg-white max-h-224 overflow-y-auto ${
              isOptionsOpen ? 'block' : 'hidden'
            }`}
          >
            <div className="flex m-1 sticky top-0 overflow-hidden dsfr-input-text-filter">
              <div className="flex items-center px-1">
                <SearchIcon className="fill-grey600" />
              </div>
              <input
                type="search"
                name={filterKey + '-filter-search-input'}
                ref={searchInputRef}
                title={intl.formatMessage(messages.search)}
                placeholder={intl.formatMessage(messages.search)}
                className="pl-1"
                aria-label="auto-search-filter"
                aria-autocomplete="list"
                aria-describedby={filterKey + '-search-input-description'}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                }}
              />
              <p
                id={filterKey + '-search-input-description'}
                className="sr-only"
              >
                <FormattedMessage {...commonMessages.accessibilitySelect} />
              </p>
            </div>
            <ul
              className="filter-options"
              role="listbox"
              aria-multiselectable="true"
              aria-labelledby={`${filterKey}-title`}
            >
              {optionList.map(
                (option, index) =>
                  stringContainsText(option.name, searchText) && (
                    <li
                      role="option"
                      aria-selected={selectedOption === index}
                      key={option.id}
                      className="cursor-pointer text-s p-1"
                      onMouseEnter={() => setSelectedOption(index)}
                      onClick={() => {
                        onOptionClick(filterKey, option);
                      }}
                    >
                      <div className="flex items-center justify-start w-full space-x-2 p-1">
                        <div
                          id={`checkbox-${kebabCase(name)}-${kebabCase(
                            option.id,
                          )}`}
                          role="checkbox"
                          tabIndex={0}
                          aria-labelledby={`checkbox-${kebabCase(
                            name,
                          )}-${kebabCase(option.id)}`}
                          aria-checked={activeOptions.includes(option.id)}
                          className={`checkbox`}
                          onFocus={() => setSelectedOption(index)}
                        >
                          <CheckIcon className="fill-white" />
                        </div>
                        <label
                          htmlFor={`checkbox-${kebabCase(name)}-${kebabCase(
                            option.id,
                          )}`}
                        >
                          {option.name}
                        </label>
                      </div>
                    </li>
                  ),
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
