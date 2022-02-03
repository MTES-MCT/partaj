export const calcTopicItemDepth = (depth: number) => {
  let depthClass: string;

  switch (depth) {
    case 0:
    case 1:
      depthClass = '';
      break;

    case 2:
      depthClass = 'pl-6';
      break;

    case 3:
      depthClass = 'pl-10';
      break;

    default:
      depthClass = 'pl-14';
      break;
  }
  return depthClass;
};
