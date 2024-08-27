import React from 'react';
import { ExternalLinkIcon } from '../Icons';
import {className} from "postcss-selector-parser";

export const ExternalLink: React.FC<React.PropsWithChildren<{
  link: string;
  text?: string;
  icon?: string;
  className?: string;
}>> = ({ link, children, text = 'font-base text-normal', icon= '', className = '' }) => {
  return (
    <a className={`navbar-nav-external space-x-1 ${className}`} target="_blank" href={link}>
      <span className={text}>{children}</span>
      <ExternalLinkIcon className={`fill-black mt-0.5 ${icon}`} />
    </a>
  );
};
