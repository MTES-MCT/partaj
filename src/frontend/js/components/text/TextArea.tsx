import React, { useEffect, useRef, useState } from 'react';

export enum TextAreaSize {
  S = 'smal',
  M = 'medium',
  L = 'large',
}

export enum TextAreaStyle {
  GREY = 'bg-grey-100',
  PURPLE = 'bg-primary-50',
}

export const TextArea: React.FC<{
  maxLength?: number;
  size?: TextAreaSize;
  hasError?: boolean;
  defaultValue: string;
  onDebounce?: Function;
  id: string;
  style?: TextAreaStyle;
}> = ({
  maxLength,
  onDebounce,
  defaultValue,
  style = TextAreaStyle.GREY,
  size = 's',
  hasError = false,
  id,
}) => {
  const [bufferedValue, setBufferedValue] = useState<string>(defaultValue);
  const [value, setValue] = useState<string>(defaultValue);
  const ref = useRef(null);
  const getSize = (sizeProps: TextAreaSize) => {
    switch (sizeProps) {
      case TextAreaSize.M:
        return '5rem';
      case TextAreaSize.L:
        return '7rem';
      default:
        return '3rem';
    }
  };

  useEffect(() => {
    const pollForChange = setInterval(() => {
      if (value !== bufferedValue) {
        setBufferedValue(value);
        onDebounce?.(value);
      }
    }, 500);

    return () => {
      clearInterval(pollForChange);
    };
  }, [value, bufferedValue]);

  return (
    <div className="relative">
      {/* This div is used as a carbon copy of the textarea. It's a trick to auto-expand
            the actual textarea to fit its content. */}
      <div
        aria-hidden={true}
        className="text-sm border-b-2 py-2 whitespace-pre-wrap opacity-0 overflow-hidden"
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
          className={`dsfr-input-text ${style} ${
            hasError ? 'dsfr-input-text-error' : ''
          }`}
          style={{ minHeight: getSize(size as TextAreaSize) }}
          ref={ref}
          name="preliminary-work"
          value={value}
          autoFocus={false}
          maxLength={maxLength}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />
      </div>
    </div>
  );
};
