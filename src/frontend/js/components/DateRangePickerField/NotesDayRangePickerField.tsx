import React from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';

interface NoteDateRangePickerFieldProps {
  onSelectRange: (dateRange?: DateRange) => void;
  currentRange?: DateRange;
}

export const DateRangePickerModal = ({
  onSelectRange,
  currentRange,
}: NoteDateRangePickerFieldProps) => {
  return (
    <DayPicker
      mode={'range'}
      defaultMonth={new Date()}
      locale={fr}
      selected={currentRange}
      onSelect={(dateRange) => {
        onSelectRange(dateRange);
      }}
    />
  );
};
