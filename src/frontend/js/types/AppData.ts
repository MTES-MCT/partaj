/* Shape of the application data as provided by the backend. */
export interface AppData {
  assets: {
    icons: string;
  };
  csrftoken: string;
  environment: string;
  sentry_dsn: string;
  contact_email: string;
  env_version: string;
  token: string;
  url_admin: string;
  url_logout: string;
  metrics_daj_url: string;
  metrics_users_url: string;
}
