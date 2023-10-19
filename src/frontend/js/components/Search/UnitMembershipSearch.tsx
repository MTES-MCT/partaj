import { QueryFunction, QueryKey, useQueryClient } from 'react-query';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import * as types from '../../types';
import { fetchList } from '../../data/fetchList';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { UserLite } from '../../types';
import { ResultList } from './ResultList';
import { AtIcon, SearchIcon } from '../Icons';
import { useClickOutside } from '../../utils/useClickOutside';
import { commonMessages } from '../../const/translations';

const messages = defineMessages({
  notifyByEmail: {
    defaultMessage: 'Notify by Email',
    description: 'Click to search someone by email and notify them',
    id: 'components.UnitMembershipSearch.notifyByEmail',
  },
  searchPeople: {
    defaultMessage: 'Search people to notify',
    description: 'Search someone by email to notify them',
    id: 'components.UnitMembershipSearch.searchPeople',
  },
  searchInputDescription: {
    defaultMessage:
      'Use the UP / DOWN arrows to navigate within the suggestion list. Press Enter to select an option. On touch terminals, use swipe to navigate and double-tap to and double-tap to select an option',
    description: 'Search input description for accessibility',
    id: 'components.UnitMembershipSearch.searchInputDescription',
  },
});

interface UnitMembershipSearchProps {
  addItem: (item: UserLite) => void;
  onClose: Function;
  onOpen: Function;
}

export const UnitMembershipSearch = ({
  addItem,
  onClose,
  onOpen,
}: UnitMembershipSearchProps) => {
  const queryClient = useQueryClient();
  const { referral } = useContext(ReferralContext);
  const intl = useIntl();
  const [selectedOption, setSelectedOption] = useState<number>(-1);
  const [results, setResults] = useState<UserLite[]>([]);
  const [display, setDisplay] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [firstDisplay, setFirstDisplay] = useState<boolean>(true);

  const closeSearch = () => {
    onClose();
    setInputValue('');
    setResults([]);
    setDisplay(false);
  };

  const onButtonClick = () => {
    setDisplay((prevState) => {
      prevState && closeSearch();
      !prevState && setFirstDisplay(false);
      return !prevState;
    });
  };

  const onSelect = (item: UserLite) => {
    addItem(item);
    closeSearch();
  };

  const { ref } = useClickOutside({
    onClick: () => {
      display && closeSearch();
    },
  });

  const inputRef = useRef(null);

  useEffect(() => {
    if (display) {
      (inputRef.current! as HTMLElement).focus();
      onOpen();
    }
    !display && !firstDisplay && onClose();
  }, [display]);

  useEffect(() => {
    if (results.length > 0) {
      setSelectedOption(0);
    }
  }, [results]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (display) {
      const key = event.key || event.keyCode;
      switch (key) {
        case 'Esc':
        case 'Escape':
        case 27:
          event.preventDefault();
          closeSearch();
          break;
        case 'Enter':
          event.preventDefault();
          results.length > 0 && addItem(results[selectedOption]);
          closeSearch();
          break;
        case 'ArrowUp':
          event.preventDefault();
          results.length > 0 &&
            setSelectedOption((prevState) => {
              return prevState - 1 >= 0 ? prevState - 1 : results.length - 1;
            });
          break;
        case 'ArrowDown':
          event.preventDefault();
          results.length > 0 &&
            setSelectedOption((prevState) => {
              return prevState == results.length - 1 ? 0 : prevState + 1;
            });
          break;
        default:
          break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [handleKeyDown]);

  const getUsers = async (value: string) => {
    const users: types.APIList<types.UserLite> = await queryClient.fetchQuery(
      ['users/list_unit_members', { query: value, referral: referral!.id }],
      fetchList as QueryFunction<any, QueryKey>,
    );
    setResults(users.results);
  };

  return (
    <div tabIndex={0} role="button" ref={ref} className="relative">
      <ResultList
        resultList={results}
        display={display}
        onClick={(item: UserLite) => onSelect(item)}
        selectedOption={selectedOption}
      />
      <div className="flex">
        <div
          className={`flex ${
            display ? 'search-input-open' : 'search-input-closed'
          }`}
        >
          <div className="flex bg-primary-200 items-center p-1">
            <SearchIcon />
          </div>
          <input
            ref={inputRef}
            role="combobox"
            aria-autocomplete="list"
            aria-describedby="user-search-input-description"
            placeholder={intl.formatMessage(messages.searchPeople)}
            className={`search-input search-input-primary`}
            type="text"
            title={intl.formatMessage(messages.searchPeople)}
            aria-label={intl.formatMessage(messages.searchPeople)}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              e.target.value ? getUsers(e.target.value) : getUsers('');
            }}
          />
          <p id="user-search-input-description" className="sr-only">
            <FormattedMessage {...commonMessages.accessibilitySelect} />
          </p>
        </div>
        <div className="mr-1">
          <button
            className="tooltip tooltip-action"
            data-tooltip={intl.formatMessage(messages.notifyByEmail)}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onButtonClick();
            }}
          >
            <AtIcon active={display} />
          </button>
        </div>
      </div>
    </div>
  );
};
