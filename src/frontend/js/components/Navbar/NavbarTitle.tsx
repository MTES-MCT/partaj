import React from 'react';

type SidebarTitleProps = React.PropsWithChildren<{}>;

export const NavbarTitle: React.FC<SidebarTitleProps> = ({ children }) => {
  return <div className="navbar-title">{children}</div>;
};
