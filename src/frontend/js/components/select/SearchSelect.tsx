import React, { useEffect, useRef, useState } from 'react';
import { DOMElementPosition } from '../../types';
import { useClickOutside } from '../../utils/useClickOutside';
import { CheckIcon, ChevronBottomIcon, IconColor, SearchIcon } from '../Icons';
import { stringContainsText } from '../../utils/string';

interface Option {
  key: string;
}
interface SearchSelectProps {
  options: Array<Option>;
  name?: string;
  filterKey: string;
  onOptionClick: Function;
  activeOptions: Array<string>;
}

export const SearchSelect = ({
  name,
  filterKey,
  options,
  onOptionClick,
  activeOptions,
}: SearchSelectProps) => {
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

  const handleListKeyDown = (e: any) => {
    switch (e.key) {
      case 'Enter':
        onOptionClick(filterKey, optionList[selectedOption].key);
        e.preventDefault();
        break;
      case 'Escape':
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
      {optionList.length > 0 && (
        <div className="w-fit" tabIndex={-1} onKeyDown={handleListKeyDown}>
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
            <span>{name}</span>
            <ChevronBottomIcon color={IconColor.BLACK} />
          </button>
          <div
            className={`${
              isOptionsOpen ? 'fixed' : 'hidden'
            } 'bg-transparent inset-0  z-19 flex justify-center items-center`}
            style={{ margin: 0 }}
          ></div>
          <div
            ref={listRef}
            style={{ ...position, zIndex: 20 }}
            className={`fixed list-none shadow-blur bg-white max-h-224 overflow-y-auto ${
              isOptionsOpen ? 'block' : 'hidden'
            }`}
          >
            <div className="flex rounded-sm m-1 bg-gray-200 sticky top-0 overflow-hidden">
              <div className="flex items-center p-1">
                <SearchIcon color={IconColor.GRAY_300} />
              </div>
              <input
                ref={searchInputRef}
                placeholder="Rechercher"
                className="search-input bg-gray-200"
                type="text"
                aria-label="auto-search-filter"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                }}
              />
            </div>
            <ul
              className="filter-options"
              role="listbox"
              aria-multiselectable="true"
            >
              {optionList.map(
                (option, index) =>
                  stringContainsText(option.key, searchText) && (
                    <li
                      id={option.key}
                      key={option.key}
                      role="option"
                      className="cursor-pointer text-s p-1"
                      aria-selected={selectedOption === index}
                      tabIndex={0}
                      onMouseEnter={() => setSelectedOption(index)}
                      onClick={() => {
                        onOptionClick(filterKey, option.key);
                      }}
                    >
                      <div className="flex items-center justify-start w-full space-x-2 py-2 px-1 rounded-sm">
                        <div
                          role="checkbox"
                          aria-checked={activeOptions.includes(option.key)}
                          className={`checkbox`}
                        >
                          <CheckIcon color={IconColor.WHITE} />
                        </div>
                        <span>{option.key}</span>
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
