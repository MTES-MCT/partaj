import React from 'react';
import { ArrowCornerDownRight } from '../components/Icons';

interface ItemAttributes {
  cssClass: string;
  icon: React.ReactNode;
}

export const getTopicItemAttributes = (depth: number) => {
  let itemAttributes: ItemAttributes;

  switch (depth) {
    case 2:
      itemAttributes = {
        cssClass: '',
        icon: <ArrowCornerDownRight className="w-6 h-6 fill-primary100" />,
      };
      break;

    case 3:
      itemAttributes = {
        cssClass: 'pl-4',
        icon: <ArrowCornerDownRight className="w-6 h-6 fill-primary100" />,
      };
      break;

    default:
      itemAttributes = {
        cssClass: '',
        icon: <></>,
      };
      break;
  }
  return itemAttributes;
};

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
