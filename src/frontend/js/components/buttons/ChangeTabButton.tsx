import React, { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const { pathname: url } = useLocation();
  const navigate = useNavigate();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        const [__, ...urlParts] = url.split('/').reverse();
        const redirection = `${urlParts.reverse().join('/')}/${redirectUrl}`;
        navigate(redirection);
      }}
      className={
        styleLink === 'link'
          ? 'btn btn-tertiary text-sm relative focus:ring'
          : 'btn btn-primary text-sm'
      }
    >
      {children}
    </button>
  );
};
