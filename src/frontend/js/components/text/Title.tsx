import React from 'react';

export enum TitleType {
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  H5 = 'h5',
  H6 = 'h6',
}

export const Title: React.FC<{ type: TitleType; className?: string }> = ({
  type,
  className = '',
  children,
}) => {
  switch (type) {
    case TitleType.H1:
      return (
        <h1 className={`mb-2.5 text-4xl font-medium ${className}`}>
          {' '}
          {children}
        </h1>
      );
    case TitleType.H2:
      return (
        <h2 className={`mb-2.5 text-3xl font-medium ${className}`}>
          {' '}
          {children}
        </h2>
      );
    case TitleType.H3:
      return (
        <h3 className={`mb-2.5 text-2xl font-medium ${className}`}>
          {' '}
          {children}
        </h3>
      );
    case TitleType.H4:
      return (
        <h4 className={`mb-2.5 text-xl font-medium ${className}`}>
          {' '}
          {children}
        </h4>
      );
    case TitleType.H5:
      return (
        <h5 className={`mb-2.5 text-lg font-medium ${className}`}>
          {' '}
          {children}
        </h5>
      );
    case TitleType.H6:
      return (
        <h6 className={`text-base font-medium ${className}`}> {children}</h6>
      );
    default:
      return (
        <h1 className={`mb-2.5 text-4xl font-medium ${className}`}>
          {' '}
          {children}
        </h1>
      );
  }
};
