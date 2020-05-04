/**
 * Generic placeholder for error handling. Allows us to send errors to the appropriate handler
 * before we set up error monitoring facilities.
 */
export const handle = (error: Error) => {
  console.error(error);
};
