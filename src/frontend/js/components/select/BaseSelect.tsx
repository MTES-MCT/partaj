import React, { useRef, useState } from 'react';
import { DOMElementPosition } from '../../types';
import { useClickOutside } from '../../utils/useClickOutside';
import { ArrowDownIcon } from '../Icons';
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
  description?: string;
  display: boolean;
  active?: {
    text: string;
    css: string;
    isActive: boolean;
  };
  css: string;
  onClick: () => void;
}

export const BaseSelect = ({
  options,
  buttonTooltip,
  buttonCss,
  children,
  height = 250,
}: React.PropsWithChildren<{
  options: Array<SelectOption>;
  buttonTooltip?: string;
  buttonCss?: string;
  height?: number;
}>) => {
  const intl = useIntl();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const listRef = useRef(null);

  const [position, setPosition] = useState<DOMElementPosition>({
    top: 0,
    right: 0,
  });

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
    if (remainingBottomSpace < height) {
      return {
        bottom:
          window.innerHeight - buttonRef.current.getBoundingClientRect().top,
        right:
          window.innerWidth - buttonRef.current.getBoundingClientRect().right,
      };
    }
    return {
      top: buttonRef.current.getBoundingClientRect().top + 5,
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
          selectedOption - 1 >= 0 ? selectedOption - 1 : options.length - 1,
        );
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedOption(
          selectedOption == options.length - 1 ? 0 : selectedOption + 1,
        );
        break;
      default:
        break;
    }
  };

  return (
    <>
      {options.length > 0 && (
        <div className="select-container">
          <button
            ref={ref}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOptionsOpen}
            className={`${
              buttonTooltip && 'tooltip tooltip-action'
            } button whitespace-nowrap button-fit px-2 text-base text-black space-x-1 ${
              buttonCss ?? 'button-white-grey'
            }`}
            onClick={() => toggleOptions(ref)}
            onKeyDown={handleListKeyDown}
            data-tooltip={intl.formatMessage(messages.topicTooltip)}
          >
            <>
              {children ?? options[selectedOption].value}
              <ArrowDownIcon className="fill-black" />
            </>
          </button>
          <div
            className={`${
              isOptionsOpen ? 'fixed' : 'hidden'
            } 'bg-transparent inset-0  z-19 flex justify-center items-center`}
            style={{ margin: 0 }}
          >
            <ul
              style={{ ...position, zIndex: 20, maxWidth: 350 }}
              className={`select-list fixed list-none p-0 shadow-blur bg-white `}
              role="listbox"
              aria-activedescendant={options[selectedOption].value}
              tabIndex={-1}
              onKeyDown={handleListKeyDown}
              ref={listRef}
            >
              {options.map((option, index) => (
                <>
                  {option.display && (
                    <div className="select-option">
                      <li
                        id={option.value}
                        key={option.id}
                        className={`${option.css} m-2 cursor-pointer space-y-2 rounded-sm`}
                        role="option"
                        aria-selected={selectedOption == index}
                        tabIndex={0}
                        onKeyDown={handleKeyDown(index)}
                        onClick={() => {
                          setIsOptionsOpen(false);
                          option.onClick();
                        }}
                      >
                        <div className="space-y-2 p-2">
                          <div className="flex full-w space-x-2">
                            <span style={{ lineHeight: '14px' }}>
                              {option.value}
                            </span>
                            {option.active?.isActive && (
                              <span
                                style={{ lineHeight: '14px' }}
                                className={`leading-4 ` + option.active.css}
                              >
                                {option.active.text}
                              </span>
                            )}
                          </div>
                          {option.description && (
                            <p className="text-sm text-gray-600">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </li>
                    </div>
                  )}
                </>
              ))}
            </ul>
          </div>
          <div
            className={`${
              isOptionsOpen ? 'fixed' : 'hidden'
            } 'bg-transparent inset-0 z-9 flex justify-center items-center`}
            style={{ margin: 0 }}
          >
            {' '}
          </div>
        </div>
      )}
    </>
  );
};
