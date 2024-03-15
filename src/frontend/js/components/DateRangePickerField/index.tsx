import React, { forwardRef, useState } from 'react';
import {
  ButtonProps,
  DateRange,
  DayContentProps,
  DayPicker,
  useDayPicker,
} from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Locale, format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  nextMonth: {
    defaultMessage: 'Go to next month',
    description: 'Accessibility label to go to the next month in the calendar',
    id: 'components.DateRangePickerField.nextMonth',
  },
  prevMonth: {
    defaultMessage: 'Go to previous month',
    description:
      'Accessibility label to go to the previous month in the calendar',
    id: 'components.DateRangePickerField.prevMonth',
  },
});

interface DateRangePickerFieldProps {
  onSelectRange: (dateRange?: DateRange) => void;
}

const DayContent = (props: DayContentProps): JSX.Element => {
  const {
    locale,
    classNames,
    styles,
    labels: { labelDay },
    formatters: { formatDay },
  } = useDayPicker();

  return (
    <>
      <span aria-hidden="true">{formatDay(props.date, { locale })}</span>
      <span className={classNames.vhidden} style={styles.vhidden}>
        {labelDay(props.date, props.activeModifiers, { locale })}
      </span>
    </>
  );
};

export const DateRangePickerField = ({
  onSelectRange,
}: DateRangePickerFieldProps) => {
  const [range, setRange] = useState<DateRange | undefined>();
  const intl = useIntl();

  const getLocale = (): Locale => {
    const locales: { [_: string]: Locale } = {
      fr: fr,
      en: enUS,
    };

    return locales[intl.locale] || fr;
  };

  return (
    <DayPicker
      mode={'range'}
      defaultMonth={new Date()}
      locale={getLocale()}
      selected={range}
      onSelect={(dateRange) => {
        setRange(dateRange);
        onSelectRange(dateRange);
      }}
      labels={{
        labelDay: (day) =>
          format(day, 'eeee dd MMMM yyyy', {
            locale: getLocale(),
          }),
        labelNext: () => intl.formatMessage(messages.nextMonth),
        labelPrevious: () => intl.formatMessage(messages.prevMonth),
      }}
      components={{ DayContent }}
    />
  );
};
