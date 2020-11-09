import React from 'react';

import { ContextProps } from 'types/context';

interface ReferralActivityIndicatorLookProps {
  topLine: JSX.Element;
  bottomLine: JSX.Element;
}

export const ReferralActivityIndicatorLook = ({
  context,
  topLine,
  bottomLine,
}: ReferralActivityIndicatorLookProps & ContextProps) => (
  <section className="flex flex-row">
    <svg
      role="img"
      aria-hidden="true"
      className="fill-current text-gray-500 w-12 h-12 -ml-6"
    >
      <use xlinkHref={`${context.assets.icons}#icon-dot-single`} />
    </svg>
    <div>
      <div>{topLine}</div>
      <div className="text-gray-600">{bottomLine}</div>
    </div>
  </section>
);
