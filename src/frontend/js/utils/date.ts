import { Maybe } from '../types/utils';

export const stringToDate = (value: string | undefined) => {
  if (!value) {
    return;
  }

  const splitValue = value.split('-');

  return new Date(
    Number(splitValue[0]),
    Number(splitValue[1]) - 1,
    Number(splitValue[2]),
  );
};

export const dateToString = (value: Maybe<Date>) => {
  if (!value) {
    return;
  }

  const hoursToAdd = 60 * 60 * 1000;
  value.setTime(value.getTime() + hoursToAdd);

  return value?.toISOString().substring(0, 10);
};

export const convertDayPickerDateToString = (value: Maybe<Date>) => {
  if (!value) {
    return;
  }

  // We add an hour because day picker Date is European Timezone and IsoString function is UTC that remove a day during conversion
  const hoursToAdd = 60 * 60 * 1000;
  value.setTime(value.getTime() + hoursToAdd);

  return value?.toISOString().substring(0, 10);
};
