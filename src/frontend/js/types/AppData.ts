/* Shape of the application data as provided by the backend. */
export interface AppData {
  assets: {
    icons: string;
  };
  csrftoken: string;
  environment: string;
  sentry_dsn: string;
  token: string;
  url_admin: string;
  url_logout: string;
}
