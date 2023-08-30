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
    <div
      onClick={(e) => {
        e.preventDefault();
        const [__, ...urlParts] = url.split('/').reverse();
        const redirection = `${urlParts.reverse().join('/')}/${redirectUrl}`;
        history.push(redirection);
      }}
      role="button"
      className={
        styleLink === 'link'
          ? 'flex items-center relative btn  btn-light-gray focus:ring'
          : 'btn btn-primary'
      }
    >
      {children}
    </div>
  );
};
