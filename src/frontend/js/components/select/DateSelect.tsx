import React, { useRef, useState } from 'react';
import { DateRangePickerModal } from '../DateRangePickerField/NotesDayRangePickerField';
import { ChevronBottomIcon } from '../Icons';
import { useClickOutside } from '../../utils/useClickOutside';
import { DOMElementPosition } from '../../types';
import { DateRange } from 'react-day-picker';

interface DateSelectProps {
  filterName: string;
  onSelectRange: (dateRange?: DateRange) => void;
  modalPosition?: 'left' | 'right';
  range: { from: Date | undefined; to: Date | undefined };
}

export const DateSelect = ({
  onSelectRange,
  range,
  filterName,
  modalPosition = 'left',
}: DateSelectProps) => {
  const [isDatePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  const listRef = useRef(null);

  const { ref } = useClickOutside({
    onClick: () => {
      closeModal();
    },
    insideRef: listRef,
  });

  const closeModal = () => {
    setDatePickerOpen(false);
  };

  const toggleOptions = () => {
    setDatePickerOpen((prevState) => !prevState);
  };

  return (
    <div className="relative w-fit">
      <button
        ref={ref}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isDatePickerOpen}
        className={`button space-x-1 text-s text-primary-700 px-2 py-1 border border-grey-200 ${
          isDatePickerOpen ? 'bg-primary-50' : 'bg-white'
        }`}
        onClick={() => toggleOptions()}
      >
        <span>{filterName}</span>
        <ChevronBottomIcon className="fill-black" />
      </button>
      <div
        className={`${
          isDatePickerOpen ? 'fixed' : 'hidden'
        } 'bg-transparent inset-0 z-19 flex justify-center items-center`}
        style={{ margin: 0 }}
      ></div>
      <div
        ref={listRef}
        style={{ zIndex: 20 }}
        className={`absolute ${
          modalPosition + '-0'
        }  list-none shadow-blur bg-white ${
          isDatePickerOpen ? 'block' : 'hidden'
        }`}
      >
        <DateRangePickerModal
          onSelectRange={onSelectRange}
          currentRange={range as DateRange}
        />
      </div>
    </div>
  );
};
