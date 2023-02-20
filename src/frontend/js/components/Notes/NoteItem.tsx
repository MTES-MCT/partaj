import React, { useState } from 'react';

import { Note, NoteHighlightKeys } from '../../types';
import { IconTextButton } from '../buttons/IconTextButton';
import { NotePreviewModal } from './NotePreviewModal';
import ReactHtmlParser from 'react-html-parser';

export const NoteItem: React.FC<{ note: Note }> = ({
  note,
}: {
  note: Note;
}) => {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  return (
    <>
      <div className="flexp-10 m-6 border rounded">
        <div className="flex relative flex-col p-10 m-6 border rounded">
          <span>Saisine {note._source.case_number}</span>
          <div>
            <b>Auteur : </b>
            {note._source.author}
          </div>
          <div>
            <b>Unité(s) demande : </b>
            {note._source.requesters_unit_names.map((name) => (
              <span>{name}</span>
            ))}
          </div>
          <div>
            <b>Unité(s) assignées :</b>
            {note._source.assigned_units_names.map((name) => (
              <span>{name}</span>
            ))}
          </div>
          <>
            {note.highlight && (
              <div className="flex flex-col">
                <b>Occurences:</b>
                {Object.keys(note.highlight).map((key) => {
                  if (key !== 'html.language') {
                    return (
                      <div className="flex flex-col">
                        <span>
                          {' '}
                          <u>Trouvé dans {key}</u>
                        </span>
                        {note.highlight[key as NoteHighlightKeys].map(
                          (highlight) => {
                            return <span> {ReactHtmlParser(highlight)} </span>;
                          },
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </>
          <div className="absolute right-0">
            <IconTextButton
              testId="send-report-button"
              otherClasses="btn-primary"
              icon={null}
              onClick={() => {
                setModalOpen(true);
              }}
            >
              Preview
            </IconTextButton>
          </div>
        </div>
        <NotePreviewModal
          html={note._source.html}
          file={note._source.document.file}
          isModalOpen={isModalOpen}
          setModalOpen={setModalOpen}
        />
      </div>
    </>
  );
};
