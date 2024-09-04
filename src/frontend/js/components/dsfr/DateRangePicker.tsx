import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange as ReactDayPickerDateRange } from 'react-day-picker';
import { defineMessage, useIntl } from 'react-intl';

import { cn } from 'utils/cn';
import { Button } from 'components/dsfr/Button';
import { Calendar } from 'components/dsfr/Calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'components/dsfr/Popover';

const messages = {
  pickDate: defineMessage({
    id: 'dateRangePicker.pickDate',
    defaultMessage: 'Pick a date',
    description:
      'Placeholder text for the date range picker when no date is selected',
  }),
};

export type DateRange = ReactDayPickerDateRange;

interface DateRangePickerProps {
  onChange: (dateRange: DateRange | undefined) => void;
  value?: DateRange;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onChange,
  value,
}) => {
  const intl = useIntl();
  const [date, setDate] = React.useState<DateRange | undefined>(value);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const handleSelect = (selectedDateRange: DateRange | undefined) => {
    setDate(selectedDateRange);
    onChange(selectedDateRange);
  };

  return (
    <div className={cn('grid gap-2')}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {(() => {
              if (!date?.from) {
                return <span>{intl.formatMessage(messages.pickDate)}</span>;
              }
              if (date.to) {
                return (
                  <>
                    {intl.formatDate(date.from, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {intl.formatDate(date.to, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </>
                );
              }
              return intl.formatDate(date.from, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
            })()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
