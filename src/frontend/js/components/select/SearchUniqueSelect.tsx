import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { DOMElementPosition } from '../../types';
import { useClickOutside } from '../../utils/useClickOutside';
import { ChevronBottomIcon, SearchIcon } from '../Icons';
import { commonMessages } from '../../const/translations';
import { calcTopicItemDepth } from '../../utils/topics';

interface Option {
  id: string;
  name: string;
  path?: string;
}

interface SearchUniqueSelectProps {
  identifier: string;
  options: Array<Option>;
  onSearchChange: Function;
  onOptionClick: Function;
  activeOption: Option;
}

const messages = defineMessages({
  search: {
    defaultMessage: 'Search',
    description: 'Search in the different values of the selector',
    id: 'components.SearchMultiSelect.search',
  },
});

export const SearchUniqueSelect = ({
  identifier,
  options,
  onOptionClick,
  onSearchChange,
  activeOption,
}: SearchUniqueSelectProps) => {
  const intl = useIntl();

  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
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

  useEffect(() => {
    onSearchChange(searchText);
  }, [searchText]);

  useEffect(() => {
    if (options.length > 0) {
      setSelectedOption(0);
    }
  }, [options]);

  const handleListKeyDown = (e: any) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onOptionClick('ENTER IS CLICKED');
        break;
      case 'ArrowUp':
        e.preventDefault();
        options.length > 0 &&
          setSelectedOption((prevState) => {
            return prevState - 1 >= 0 ? prevState - 1 : options.length - 1;
          });
        break;
      case 'ArrowDown':
        e.preventDefault();
        options.length > 0 &&
          setSelectedOption((prevState) => {
            return prevState == options.length - 1 ? 0 : prevState + 1;
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
      <div className="w-fit" tabIndex={-1}>
        <button
          ref={ref}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOptionsOpen}
          className={`button space-x-1 shadow-blur-only text-s px-2 py-1 border ${
            isOptionsOpen ? 'border-black' : 'border-white'
          }`}
          onClick={() => toggleOptions(ref)}
        >
          {activeOption ? (
            <>
              <span> {activeOption.name}</span>
              <ChevronBottomIcon className="fill-black" />
            </>
          ) : (
            <>
              <span>Select a topic</span>
              <ChevronBottomIcon className="fill-black" />
            </>
          )}
        </button>
        <div
          onKeyDown={handleListKeyDown}
          ref={listRef}
          style={{ ...position, zIndex: 20 }}
          className={`fixed list-none shadow-blur bg-white max-h-224 overflow-y-auto ${
            isOptionsOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="flex rounded-sm m-1 bg-gray-200 sticky top-0 overflow-hidden">
            <div className="flex items-center p-1">
              <SearchIcon className="fill-gray300" />
            </div>
            <input
              type="search"
              name={identifier + '-filter-search-input'}
              ref={searchInputRef}
              title={intl.formatMessage(messages.search)}
              placeholder={intl.formatMessage(messages.search)}
              className="search-input bg-gray-200"
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
            <ul
              className="filter-options"
              role="listbox"
              aria-multiselectable="true"
              aria-labelledby={`${identifier}-title`}
            >
              {options.map((option, index) => (
                <li
                  role="option"
                  aria-selected={selectedOption === index}
                  key={option.id}
                  className="cursor-pointer text-s p-1"
                  onMouseEnter={() => setSelectedOption(index)}
                  onClick={() => {
                    onOptionClick(option.id);
                  }}
                >
                  <div className="flex items-center justify-start w-full space-x-2 py-2 px-1 rounded-sm">
                    <label
                      className={`${
                        option.path &&
                        calcTopicItemDepth(option.path.length / 4)
                      }`}
                    >
                      {option.name}
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <span> Pas de Résultats</span>
          )}
        </div>
      </div>
    </>
  );
};
