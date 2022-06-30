/*
 * Provide a cleaner interface to use XHR and FormData (sending a multipart form and getting
 * progress tickers) without having to deal with their verbose APIs in our components.
 */
export const sendForm: <T>(opts: {
  headers: { [key: string]: string };
  // NB: order of keys is important here, which is why we do not iterate over an object
  keyValuePairs: [string, string | File][];
  setProgress?: React.Dispatch<React.SetStateAction<number>>;
  url: string;
}) => Promise<T> = ({ headers, keyValuePairs, setProgress, url }) => {
  const formData = new FormData();
  keyValuePairs.forEach(([key, value]) => {
    return formData.append(key, value);
  });
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    for (let [header, value] of Object.entries(headers)) {
      xhr.setRequestHeader(header, value);
    }

    xhr.addEventListener('error', reject);
    xhr.addEventListener('abort', reject);

    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === 4) {
        if (xhr.status.toString().startsWith('20')) {
          return resolve(JSON.parse(xhr.response));
        }
        reject(
          new Error(
            `Failed to perform the form submission on ${url}, ${xhr.status}.`,
          ),
        );
      }
    });

    xhr.upload.addEventListener('progress', (progressEvent) => {
      if (progressEvent.lengthComputable && setProgress) {
        setProgress(
          Math.floor((progressEvent.loaded / progressEvent.total) * 100),
        );
      }
    });

    xhr.send(formData);
  });
};
