import React, { ReactNode } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

interface ChangeTabButtonProps {
  children: ReactNode;
  redirectUrl: string;
  styleLink?: string;
}

export const ChangeTabButton = ({
  children,
  redirectUrl,
  styleLink,
}: ChangeTabButtonProps) => {
  const { url } = useRouteMatch();
  const history = useHistory();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        const [__, ...urlParts] = url.split('/').reverse();
        const redirection = `${urlParts.reverse().join('/')}/${redirectUrl}`;
        history.push(redirection);
      }}
      type="button"
      className={
        styleLink === 'link'
          ? 'flex items-center relative btn btn-light-gray focus:ring underline'
          : 'btn btn-primary'
      }
    >
      {children}
    </button>
  );
};
