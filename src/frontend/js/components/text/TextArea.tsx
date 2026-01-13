import React, { useEffect, useRef } from 'react';
import { Nullable } from '../../types/utils';

export enum TextAreaSize {
  ONE_LINE = 'one_line',
  S = 'small',
  M = 'medium',
  L = 'large',
}

export const TextArea: React.FC<{
  maxLength?: number;
  className?: string;
  size?: TextAreaSize;
  hasError?: boolean;
  value: string;
  onChange: Function;
  id: string;
}> = ({
  maxLength = 524288,
  value,
  onChange,
  className,
  size = 's',
  hasError = false,
  id,
}) => {
  const ref = useRef(null);
  const getSize = (sizeProps: TextAreaSize) => {
    switch (sizeProps) {
      case TextAreaSize.ONE_LINE:
        return '';
      case TextAreaSize.M:
        return '5rem';
      case TextAreaSize.L:
        return '7rem';
      default:
        return '3rem';
    }
  };

  return (
    <div className="relative w-full">
      {/* This div is used as a carbon copy of the textarea. It's a trick to auto-expand
            the actual textarea to fit its content. */}
      <div
        aria-hidden={true}
        className="text-sm border-b-2 whitespace-pre-wrap opacity-0 overflow-hidden py-1"
        style={{ minHeight: getSize(size as TextAreaSize) }}
      >
        {value}
        {/* Zero-width space to force line-breaks to actually occur even when there
              is no characted on the new line */}
        &#65279;
      </div>
      <div className="absolute inset-0">
        <textarea
          id={id}
          className={`dsfr-input-textarea bg-grey-100 ${className} ${
            hasError ? 'dsfr-input-text-error' : ''
          }`}
          style={{ minHeight: getSize(size as TextAreaSize) }}
          ref={ref}
          name={id}
          value={value}
          autoFocus={false}
          maxLength={maxLength}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        />
      </div>
    </div>
  );
};
