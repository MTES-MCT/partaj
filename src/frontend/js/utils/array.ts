export const getLastItem = (array: Array<any>) => {
  return array.length > 0 ? array[array.length - 1] : null;
};

export const isInArray = (identifier: string, array: Array<string>) => {
  const result = array.filter((item) => item === identifier);

  return result.length > 0;
};
