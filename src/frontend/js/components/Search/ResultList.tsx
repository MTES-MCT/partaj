import { UserLite } from '../../types';
import React from 'react';
import { ResultItem } from './ResultItem';

interface ResultsProps {
  results: UserLite[];
  display: boolean;
  onClick: (item: UserLite) => void;
}

export const ResultList = ({ results, onClick, display }: ResultsProps) => {
  return (
    <>
      {display ? (
        <div className="result-list">
          {results.map((item: UserLite) => {
            return <ResultItem onClick={(item) => onClick(item)} item={item} />;
          })}
        </div>
      ) : null}
    </>
  );
};
