import React, { useEffect, useRef } from 'react';
import { kebabCase } from 'lodash-es';

export const RadioButton: React.FC<{
  groupName: string;
  isSelected: boolean;
  isFocused: boolean;
  isFocusable?: boolean;
  value: string;
  name: string;
  onClick: Function;
  onKeyDown: Function;
}> = ({
  isSelected,
  isFocused,
  isFocusable,
  value,
  name,
  onClick,
  onKeyDown,
}) => {
  const identifier = `option-${kebabCase(name)}-${kebabCase(value)}`;
  const ref = useRef(null);

  useEffect(() => {
    if (isFocused) {
      (ref.current! as HTMLElement).focus();
    }
  }, [isFocused]);

  return (
    <div
      ref={ref}
      onKeyDown={(e) => onKeyDown(e)}
      className="dsfr-radio-button"
      tabIndex={isSelected || isFocusable ? 0 : -1}
      role="radio"
      aria-checked={isSelected}
      aria-labelledby={identifier}
      onClick={(e) => {
        onClick(value);
      }}
    >
      <div></div>
      <span id={identifier}>{name}</span>
    </div>
  );
};
