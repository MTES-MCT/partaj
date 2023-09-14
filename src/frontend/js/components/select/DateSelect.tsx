import React, { useRef, useState } from 'react';
import { NoteDateRangePickerField } from '../DateRangePickerField/NotesDayRangePickerField';
import { ChevronBottomIcon, IconColor } from '../Icons';
import { useClickOutside } from '../../utils/useClickOutside';
import { DOMElementPosition } from '../../types';

interface DateSelectProps {
  onSelectRange: (from: Date, to: Date) => void;
  range: { from: string | undefined; to: string | undefined };
}

export const DateSelect = ({ range, onSelectRange }: DateSelectProps) => {
  const [isDatePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  const listRef = useRef(null);
  const [position, setPosition] = useState<DOMElementPosition>({
    top: 0,
    left: 0,
  });

  const { ref } = useClickOutside({
    onClick: () => {
      closeModal();
    },
    insideRef: listRef,
  });

  const openModal = (buttonRef: any) => {
    setPosition(getPosition(buttonRef));
    setDatePickerOpen(true);
  };

  const getPosition = (buttonRef: any) => {
    return {
      top: buttonRef.current.getBoundingClientRect().top,
      left: buttonRef.current.getBoundingClientRect().left,
      marginTop: '35px',
    };
  };

  const closeModal = () => {
    setDatePickerOpen(false);
  };

  const toggleOptions = () => {
    isDatePickerOpen ? closeModal() : openModal(ref);
  };

  return (
    <div className="w-fit">
      <button
        ref={ref}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isDatePickerOpen}
        className={`button space-x-1 shadow-blur-only text-s px-2 py-1 border ${
          isDatePickerOpen ? 'border-black' : 'border-white'
        }`}
        onClick={() => toggleOptions()}
      >
        <span>Date de publication</span>
        <ChevronBottomIcon color={IconColor.BLACK} />
      </button>
      <div
        className={`${
          isDatePickerOpen ? 'fixed' : 'hidden'
        } 'bg-transparent inset-0  z-19 flex justify-center items-center`}
        style={{ margin: 0 }}
      ></div>
      <div
        ref={listRef}
        style={{ ...position, zIndex: 20 }}
        className={`fixed list-none shadow-blur bg-white ${
          isDatePickerOpen ? 'block' : 'hidden'
        }`}
      >
        <NoteDateRangePickerField range={range} onSelectRange={onSelectRange} />
      </div>
    </div>
  );
};
