import React, { useState } from 'react';
import { FormattedDate } from 'react-intl';
import { ReferralReportVersion, User } from '../../types';
import { DropzoneFileUploader } from '../DropzoneFileUploader';
import { urls } from '../../const';
import { useCurrentUser } from '../../data/useCurrentUser';
import { Nullable } from '../../types/utils';
import { isAuthor } from '../../utils/version';

interface VersionProps {
  version: ReferralReportVersion;
  index: number;
  versionsLength: number;
  onUpdateSuccess: (result: ReferralReportVersion, index: number) => void;
  onUpdateError: (error: any) => void;
}

export const Version: React.FC<VersionProps> = ({
  version,
  index,
  versionsLength,
  onUpdateSuccess,
  onUpdateError,
}) => {
  const { currentUser } = useCurrentUser();
  const [isUpdating, setUpdating] = useState(false);

  return (
    <>
      {!isUpdating ? (
        <tr key={version.id} className={`stretched-link-container relative`}>
          <td> Version {index + 1}</td>
          <td>
            <FormattedDate
              year="numeric"
              month="long"
              day="numeric"
              value={version.updated_at}
            />
          </td>
          <td>
            <p>
              {version.created_by.first_name} {version.created_by.last_name}
            </p>
            <p>{version.created_by.unit_name}</p>
          </td>
          <td>
            <a
              className="text-primary-500 hover:underline focus:underline"
              href={version.document.file}
              key={version.document.id}
            >
              {version.document.name_with_extension}
            </a>
          </td>
          <td>
            {versionsLength === index + 1 && isAuthor(currentUser, version) && (
              <button onClick={() => setUpdating(true)}>Modifier</button>
            )}
          </td>
        </tr>
      ) : (
        <tr
          key={'dropzone-area'}
          className={`stretched-link-container relative`}
        >
          <td colSpan={5}>
            <DropzoneFileUploader
              onSuccess={(result) => {
                onUpdateSuccess(result, index);
                setUpdating(false);
              }}
              onError={(error) => onUpdateError(error)}
              action={'PUT'}
              id={version.id}
              url={urls.versions}
            />
          </td>
        </tr>
      )}
    </>
  );
};
