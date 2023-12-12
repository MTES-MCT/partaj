import React, { useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DateRangePickerFieldProps {
  onSelectRange: (dateRange?: DateRange) => void;
}

export const DateRangePickerField = ({
  onSelectRange,
}: DateRangePickerFieldProps) => {
  const [range, setRange] = useState<DateRange | undefined>();

  return (
    <DayPicker
      mode={'range'}
      defaultMonth={new Date()}
      locale={fr}
      selected={range}
      onSelect={(dateRange) => {
        setRange(dateRange);
        onSelectRange(dateRange);
      }}
    />
  );
};
