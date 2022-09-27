import React, { ReactNode } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

interface ChangeTabButtonProps {
  children: ReactNode;
  redirectUrl: string;
}

export const ChangeTabButton = ({
  children,
  redirectUrl,
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
      className="btn btn-primary"
    >
      {children}
    </div>
  );
};
