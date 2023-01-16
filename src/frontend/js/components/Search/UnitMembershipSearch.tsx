import * as types from '../../types';
import { fetchList } from '../../data/fetchList';
import { QueryFunction, QueryKey, useQueryClient } from 'react-query';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { UserLite } from '../../types';
import { ResultList } from './ResultList';
import { AtIcon, SearchIcon } from '../Icons';
import { WrapperButton } from '../buttons/WrapperButton';
import { useClickOutside } from '../../utils/useClickOutside';

interface UnitMembershipSearchProps {
  addItem: (item: UserLite) => void;
  onSearchAction: Function;
  onDisappear: Function;
}

const EscKeyCodes = ['Escape', 'Esc', 27];

export const UnitMembershipSearch = ({
  addItem,
  onSearchAction,
  onDisappear,
}: UnitMembershipSearchProps) => {
  const queryClient = useQueryClient();
  const { referral } = useContext(ReferralContext);

  const [results, setResults] = useState<UserLite[]>([]);
  const [display, setDisplay] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');

  const { ref } = useClickOutside(() => {
    setDisplay(false);
    onSearchAction(false);
    setResults([]);
  });

  const inputRef = useRef(null);

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key || event.keyCode;

    if (EscKeyCodes.includes(key)) {
      setDisplay(false);
      onSearchAction(false);
      setResults([]);
      event.preventDefault();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (display) {
      (inputRef.current! as HTMLElement).focus();
    } else {
      onDisappear();
    }
  }, [display, inputRef]);

  const getUsers = async (value: string) => {
    const users: types.APIList<types.UserLite> = await queryClient.fetchQuery(
      ['users/list_unit_members', { query: value, referral: referral!.id }],
      fetchList as QueryFunction<any, QueryKey>,
    );
    setResults(users.results);
  };

  const onButtonClick = () => {
    setDisplay((prevState) => {
      !prevState && setInputValue('');
      !prevState && onDisappear();

      onSearchAction(!prevState);
      return !prevState;
    });
  };

  const onSelect = (item: UserLite) => {
    addItem(item);
    setResults([]);
    setDisplay(false);
    onSearchAction(false);
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
            placeholder="Rechercher la personne à notifier"
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
          <WrapperButton onClick={() => onButtonClick()}>
            <AtIcon active={display} />
          </WrapperButton>
        </div>
      </div>
    </div>
  );
};
