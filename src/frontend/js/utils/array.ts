export const getLastItem = (array: Array<any>) => {
  return array.length > 0 ? array[array.length - 1] : null;
};

export const isInArray = (identifier: string, array: Array<string>) => {
  const result = array.filter((item) => item === identifier);

  return result.length > 0;
};

export const getIndexOf = (value: string, options: Array<string>) => {
  let result = -1;
  for (let i = 0; i < options.length; i++) {
    if (options[i] === value) {
      result = i;
    }
  }

  return result;
};
