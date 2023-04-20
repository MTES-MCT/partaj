import { Attachment, SupportedFileExtension } from '../types';

export const isValidEmail = (email: string) => {
  return /\S+@\S+\.\S+/.test(email);
};

/**
 * Get a user's full name by combining name properties, mirroring what the backend does.
 */
export const getFileExtension = (attachment: Attachment) => {
  return `.${attachment.name_with_extension.split('.').pop()}`;
};

/**
 * Get a last item after splitting with a delimiter
 */
export const getLastItem = (value: string, delimiter: string) => {
  return value.split(delimiter).pop();
};

/**
 * Transform snake_case to camelCase
 */
export const toCamel = (s: string): string => {
  return s
    .toLowerCase()
    .replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('_', ''));
};

/**
 * Checks if a set of words are contained in a string
 */
export const stringContainsText = (str: string, text: string) =>
  text.split(' ').some((el) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .includes(
        el
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
      ),
  );
