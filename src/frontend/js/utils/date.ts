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

  return value?.toISOString().substring(0, 10);
};
