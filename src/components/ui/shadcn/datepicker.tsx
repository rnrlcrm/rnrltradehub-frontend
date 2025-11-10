import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../../../lib/utils';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';

export interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onDateChange,
  placeholder = 'Pick a date',
  className,
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);

  React.useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'w-full justify-start text-left font-normal',
          !selectedDate && 'text-neutral-400',
          className
        )}
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {selectedDate ? format(selectedDate, 'PPP') : <span>{placeholder}</span>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Select Date</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              className="rounded-md"
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium',
                nav: 'space-x-1 flex items-center',
                nav_button: cn(
                  'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-600'
                ),
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-neutral-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-neutral-400',
                row: 'flex w-full mt-2',
                cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-neutral-100/50 [&:has([aria-selected])]:bg-neutral-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected].day-outside)]:bg-neutral-800/50 dark:[&:has([aria-selected])]:bg-neutral-800',
                day: cn(
                  'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md inline-flex items-center justify-center'
                ),
                day_range_end: 'day-range-end',
                day_selected: 'bg-primary-500 text-white hover:bg-primary-600 hover:text-white focus:bg-primary-600 focus:text-white dark:bg-primary-600 dark:hover:bg-primary-700',
                day_today: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50',
                day_outside: 'day-outside text-neutral-400 opacity-50 aria-selected:bg-neutral-100/50 aria-selected:text-neutral-500 aria-selected:opacity-30 dark:text-neutral-600 dark:aria-selected:bg-neutral-800/50 dark:aria-selected:text-neutral-400',
                day_disabled: 'text-neutral-400 opacity-50 dark:text-neutral-600',
                day_range_middle: 'aria-selected:bg-neutral-100 aria-selected:text-neutral-900 dark:aria-selected:bg-neutral-800 dark:aria-selected:text-neutral-50',
                day_hidden: 'invisible',
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
