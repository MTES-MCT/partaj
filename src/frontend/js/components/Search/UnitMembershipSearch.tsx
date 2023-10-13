import { QueryFunction, QueryKey, useQueryClient } from 'react-query';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import * as types from '../../types';
import { fetchList } from '../../data/fetchList';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { UserLite } from '../../types';
import { ResultList } from './ResultList';
import { AtIcon, SearchIcon } from '../Icons';
import { useClickOutside } from '../../utils/useClickOutside';

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
});

interface UnitMembershipSearchProps {
  addItem: (item: UserLite) => void;
  onClose: Function;
  onOpen: Function;
}

const EscKeyCodes = ['Escape', 'Esc', 27];

export const UnitMembershipSearch = ({
  addItem,
  onClose,
  onOpen,
}: UnitMembershipSearchProps) => {
  const queryClient = useQueryClient();
  const { referral } = useContext(ReferralContext);
  const intl = useIntl();

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

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key || event.keyCode;

    if (EscKeyCodes.includes(key)) {
      closeSearch();
      event.preventDefault();
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
    <div ref={ref} className="relative">
      <ResultList
        results={results}
        display={display}
        onClick={(item: UserLite) => onSelect(item)}
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
            placeholder={intl.formatMessage(messages.searchPeople)}
            className={`search-input search-input-primary`}
            type="text"
            aria-label="auto-userunit"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              e.target.value ? getUsers(e.target.value) : setResults([]);
            }}
          />
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
