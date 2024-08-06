import React from 'react';

type SidebarTitleProps = React.PropsWithChildren<{}>;

export const NavbarTitle: React.FC<SidebarTitleProps> = ({ children }) => {
  return <h2 className="font-medium">{children}</h2>;
};
