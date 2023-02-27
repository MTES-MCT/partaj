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
