export const sortObject = (sortedKeys: Array<string>, unorderedObject: any) => {
  const unorderedObjectKeys = Object.keys(unorderedObject);

  const commonKeys = sortedKeys.filter((element) => {
    return unorderedObjectKeys.includes(element);
  });

  return commonKeys.reduce((obj, key) => {
    obj[key] = unorderedObject[key];

    return obj;
  }, {} as any);
};
