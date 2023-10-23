import { UserLite } from '../../types';
import React from 'react';
import { ResultItem } from './ResultItem';

interface ResultsProps {
  resultList: UserLite[];
  display: boolean;
  selectedOption: number;
  onClick: (item: UserLite) => void;
}

export const ResultList = ({
  resultList,
  onClick,
  display,
  selectedOption,
}: ResultsProps) => {
  return (
    <>
      {display ? (
        <div className="result-list">
          {resultList.map((item: UserLite, index) => {
            return (
              <ResultItem
                isSelected={index === selectedOption}
                key={item.id}
                onClick={(item) => onClick(item)}
                item={item}
              />
            );
          })}
        </div>
      ) : null}
    </>
  );
};
