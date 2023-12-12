import React, { useRef, useState } from 'react';
import { NoteDateRangePickerField } from '../DateRangePickerField/NotesDayRangePickerField';
import { ChevronBottomIcon } from '../Icons';
import { useClickOutside } from '../../utils/useClickOutside';
import { DOMElementPosition } from '../../types';
import { DateRange } from 'react-day-picker';

interface DateSelectProps {
  onSelectRange: (dateRange?: DateRange) => void;
  range: { from: Date | undefined; to: Date | undefined };
}

export const DateSelect = ({ onSelectRange, range }: DateSelectProps) => {
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
        <ChevronBottomIcon className="fill-black" />
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
        <NoteDateRangePickerField
          onSelectRange={onSelectRange}
          currentRange={range as DateRange}
        />
      </div>
    </div>
  );
};
