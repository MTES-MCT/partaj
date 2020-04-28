/* Shape of the context as provided by the backend. */
export interface Context {
  csrftoken: string;
}

/* Context as directly merge-able with other component props. */
export interface ContextProps {
  context: Context;
}
