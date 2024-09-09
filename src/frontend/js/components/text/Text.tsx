import React from 'react';

export enum TextType {
  PARAGRAPH_NORMAL = 'p_normal',
  PARAGRAPH_SMALL = 'p_small',
  PARAGRAPH_DESCRIPTION = 'p_description',
  SPAN_DESCRIPTION = 's_description',
  SPAN_SMALL = 's_small',
}

export const Text: React.FC<{ type?: TextType; className?: string }> = ({
  type,
  className = '',
  children,
}) => {
  switch (type) {
    case TextType.PARAGRAPH_NORMAL:
      return <p className={`text-base font-light ${className}`}> {children}</p>;
    case TextType.PARAGRAPH_SMALL:
      return <p className={`text-sm font-light ${className}`}> {children}</p>;
    case TextType.SPAN_SMALL:
      return (
        <span className={`text-sm font-light ${className}`}> {children}</span>
      );
    case TextType.PARAGRAPH_DESCRIPTION:
      return (
        <p className={`text-sm font-light text-grey-600 ${className}`}>
          {' '}
          {children}
        </p>
      );
    case TextType.SPAN_DESCRIPTION:
      return (
        <span className={`text-sm text-grey-600 font-light ${className}`}>
          {' '}
          {children}
        </span>
      );
    default:
      return <span className={`${className}`}> {children}</span>;
  }
};
