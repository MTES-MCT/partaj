import React, { useRef, useState } from 'react';
import { DOMElementPosition} from "../../types";
import { useClickOutside } from '../../utils/useClickOutside';
import { ArrowDownIcon, IconColor } from '../Icons';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  topicTooltip: {
    defaultMessage: 'Change topic for everybody',
    description: 'Topic select tooltip text',
    id: 'components.TopicSelect.topicTooltip',
  },
});

export interface SelectOption {
  id: string;
  value: string;
  onClick: () => void;
}

export const BaseSelect = ({ options, buttonTooltip }: { options: Array<SelectOption>, buttonTooltip?: string }) => {
  const intl = useIntl();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const listRef = useRef(null);

  const [position, setPosition] = useState<DOMElementPosition>({
    top: 0,
    right: 0,
  });

  const [optionList, setOptionList] = useState<Array<SelectOption>>(options);

  const getSelectedOption = (id: string) => {
    for (let index in optionList) {
      if (optionList[index].id === id) {
        return { option: optionList[index], index: index };
      }
    }
  };

  const { ref } = useClickOutside({
    onClick: () => {
      setIsOptionsOpen(false);
    },
    insideRef: listRef,
  });

  const toggleOptions = (buttonRef: any) => {
    setPosition(getPosition(buttonRef));
    setIsOptionsOpen(!isOptionsOpen);
  };

  const setSelectedThenCloseDropdown = (index: any) => {
    setSelectedOption(index);
    setIsOptionsOpen(false);
  };

  const getPosition = (buttonRef: any) => {
    const remainingBottomSpace =
      window.innerHeight - buttonRef.current.getBoundingClientRect().top;
    if (remainingBottomSpace < 250) {
      return {
        bottom:
          window.innerHeight - buttonRef.current.getBoundingClientRect().top,
        right:
          window.innerWidth - buttonRef.current.getBoundingClientRect().right,
      };
    }
    return {
      top: buttonRef.current.getBoundingClientRect().top,
      right:
        window.innerWidth - buttonRef.current.getBoundingClientRect().right,
      marginTop: '28px',
    };
  };

  const handleKeyDown = (index: any) => (e: any) => {
    switch (e.key) {
      case ' ':
      case 'SpaceBar':
      case 'Enter':
        e.preventDefault();
        setSelectedThenCloseDropdown(index);
        break;
      default:
        break;
    }
  };

  const handleListKeyDown = (e: any) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOptionsOpen(false);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedOption(
          selectedOption - 1 >= 0 ? selectedOption - 1 : optionList.length - 1,
        );
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedOption(
          selectedOption == optionList.length - 1 ? 0 : selectedOption + 1,
        );
        break;
      default:
        break;
    }
  };

  return (
    <>
      {optionList.length > 0 && (
        <div className="select-container">
          <button
            ref={ref}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOptionsOpen}
            className={`${buttonTooltip && 'tooltip tooltip-action'} button whitespace-no-wrap w-full button-white-grey button-superfit text-base text-black space-x-1 max-w-1/1`}
            onClick={() => toggleOptions(ref)}
            onKeyDown={handleListKeyDown}
            data-tooltip={intl.formatMessage(messages.topicTooltip)}
          >
            <span
              className="truncate"
              style={{ width: 'calc(100% - 1.25rem)' }}
            >
              {optionList[selectedOption].value}
            </span>
            <ArrowDownIcon color={IconColor.GREY_400} />
          </button>
          <ul
            style={{ ...position, zIndex: 20, maxHeight: 240 }}
            className={`fixed overflow-y-scroll select-options shadow-blur ${
              isOptionsOpen ? 'block' : 'hidden'
            }`}
            role="listbox"
            aria-activedescendant={optionList[selectedOption].value}
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
            ref={listRef}
          >
            {optionList.map((option, index) => (
              <li
                id={option.value}
                key={option.id}
                role="option"
                aria-selected={selectedOption == index}
                tabIndex={0}
                onKeyDown={handleKeyDown(index)}
                onClick={() => {
                  setIsOptionsOpen(false);
                  option.onClick();
                }}
              >
                {option.value}
              </li>
            ))}
          </ul>
          <div
            className={`${
              isOptionsOpen ? 'fixed' : 'hidden'
            } 'bg-transparent inset-0  z-9 flex justify-center items-center`}
            style={{ margin: 0 }}
          >
            {' '}
          </div>
        </div>
      )}
    </>
  );
};
