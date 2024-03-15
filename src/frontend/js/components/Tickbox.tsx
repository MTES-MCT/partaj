import React from 'react';

import { appData } from 'appData';

interface TickboxProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  isTicked: boolean;
}

export const Tickbox: React.FC<TickboxProps> = ({
  className = '',
  isTicked,
  ...restProps
}) => (
  <div
    className={`flex items-center justify-center w-5 h-5 bg-gray-700 rounded-sm text-white ${className}`}
    {...restProps}
  >
    {isTicked ? (
      <svg role="presentation" className="w-3 h-3 fill-current">
        <use xlinkHref={`${appData.assets.icons}#icon-tick`} />
      </svg>
    ) : null}
  </div>
);
