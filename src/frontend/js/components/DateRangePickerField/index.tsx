import React, { useState } from 'react';
import DayPicker, { DateUtils } from 'react-day-picker';

import { Maybe } from 'types/utils';

interface DateRangePickerFieldProps {
  onSelectRange: (from: Date, to: Date) => void;
}

export const DateRangePickerField = ({
  onSelectRange,
}: DateRangePickerFieldProps) => {
  const [from, setFrom] = useState<Maybe<Date>>();
  const [to, setTo] = useState<Maybe<Date>>();
  const [enteredTo, setEnteredTo] = useState<Maybe<Date>>();

  const isSelectingFirstDay = (
    from: Maybe<Date>,
    to: Maybe<Date>,
    day: Date,
  ) => {
    const isBeforeFirstDay = from && DateUtils.isDayBefore(day, from);
    const isRangeSelected = from && to;
    return isBeforeFirstDay || isRangeSelected;
  };

  const resetState = () => {
    setFrom(undefined);
    setTo(undefined);
    setEnteredTo(undefined);
  };

  const onDayClick = (day: Date) => {
    if (from && to && day >= from && day <= to) {
      resetState();
    } else if (!from || isSelectingFirstDay(from, to, day)) {
      setFrom(day);
      setTo(undefined);
      setEnteredTo(undefined);
    } else {
      setTo(day);
      setEnteredTo(day);
      onSelectRange(from, day);
    }
  };

  const onDayMouseEnter = (day: Date) => {
    if (!isSelectingFirstDay(from, to, day)) {
      setEnteredTo(day);
    }
  };

  return (
    <DayPicker
      className="day-picker--range w-full"
      numberOfMonths={1}
      fromMonth={new Date(2020, 0, 1)}
      selectedDays={[from, { from, to: enteredTo }]}
      disabledDays={from ? [{ before: from }] : []}
      modifiers={{ start: from, end: enteredTo }}
      onDayClick={onDayClick}
      onDayMouseEnter={onDayMouseEnter}
    />
  );
};
