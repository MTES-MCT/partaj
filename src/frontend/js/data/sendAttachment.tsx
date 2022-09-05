import { Attachment } from '../types';
import { sendFile } from '../utils/sendFile';
import { appData } from '../appData';

export const sendAttachment = async ({
  files,
  action,
  url,
  keyValues,
  onProgress = () => {},
  onSuccess,
  onError,
}: {
  action: string;
  url: string;
  files: File[];
  onSuccess: (attachment: Attachment) => void;
  onError: (error: any) => void;
  onProgress?: (error: any) => void;
  keyValues?: [string, string];
}) => {
  const send_files = files.map((file) => ['files', file] as [string, File]);

  const keyValuePairs: [string, string | File][] = keyValues
    ? [keyValues, ...send_files]
    : [...send_files];

  try {
    const attachment = await sendFile<any>({
      headers: { Authorization: `Token ${appData.token}` },
      keyValuePairs,
      url,
      action: action,
      setProgress: onProgress,
    });
    onSuccess(attachment);
  } catch (error) {
    onError(error);
  }
};
