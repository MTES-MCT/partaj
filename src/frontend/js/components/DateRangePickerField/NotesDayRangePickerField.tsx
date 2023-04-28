import React, { useEffect, useState } from 'react';
import DayPicker, { DateUtils } from 'react-day-picker';

import { Maybe } from 'types/utils';
import { useReactDayPickerL10n } from 'utils/sharedMessages';
import { dateToString, stringToDate } from '../../utils/date';

interface NoteDateRangePickerFieldProps {
  onSelectRange: (from: Date, to: Date) => void;
  range: { from: string | undefined; to: string | undefined };
}

export const NoteDateRangePickerField = ({
  onSelectRange,
  range,
}: NoteDateRangePickerFieldProps) => {
  const { MONTHS, WEEKDAYS_LONG, WEEKDAYS_SHORT } = useReactDayPickerL10n();

  const [from, setFrom] = useState<Maybe<Date>>(stringToDate(range.from));
  const [to, setTo] = useState<Maybe<Date>>(stringToDate(range.to));

  useEffect(() => {
    if (range.from != dateToString(from)) {
      setFrom(stringToDate(range.from));
    }

    if (range.to != dateToString(to)) {
      setTo(stringToDate(range.to));
    }
  }, [range]);

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
  };

  const onDayClick = (day: Date) => {
    if (from && to && day >= from && day <= to) {
      resetState();
    } else if (!from || isSelectingFirstDay(from, to, day)) {
      setFrom(day);
      setTo(undefined);
    } else {
      setTo(day);
      onSelectRange(from, day);
    }
  };

  return (
    <DayPicker
      className="day-picker--range w-full"
      months={MONTHS}
      weekdaysLong={WEEKDAYS_LONG}
      weekdaysShort={WEEKDAYS_SHORT}
      numberOfMonths={1}
      fromMonth={new Date(2020, 0)}
      selectedDays={[from, { from: from, to: to }]}
      disabledDays={from ? [{ before: from }] : []}
      modifiers={{
        start: from,
        end: to,
      }}
      onDayClick={onDayClick}
    />
  );
};
