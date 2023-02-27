import React, { useEffect, useState } from 'react';

import { useNoteDetailsAction } from '../../data/notes';
import { Note, SupportedFileExtension } from '../../types';
import { Nullable } from '../../types/utils';
import { getFileExtension } from '../../utils/string';
import ReactHtmlParser from 'react-html-parser';
import { Document, Page } from 'react-pdf';
import { useParams } from 'react-router-dom';

export interface NoteRouteParams {
  noteId: string;
}

export const NoteDetailView: React.FC = () => {
  const { noteId } = useParams<NoteRouteParams>();
  const [note, setNote] = useState<Nullable<Note>>(null);
  const [numPages, setNumPages] = useState<Nullable<number>>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const notesMutation = useNoteDetailsAction({
    onSuccess: (data, variables, context) => {
      setNote(data);
    },
    onError: (error, variables, context) => {
      console.log(error);
    },
  });

  useEffect(() => {
    if (!note && notesMutation.isIdle) {
      notesMutation.mutate({ id: noteId });
    }
  });

  return (
    <div className="flex flex-grow justify-center">
      {notesMutation.isSuccess && note && (
        <div className="relative w-full border max-w-800">
          {getFileExtension(note.document) ===
            SupportedFileExtension.EXTENSION_DOCX && (
            <div className="p-6">
              <div className="p-10 bg-white">{ReactHtmlParser(note.html)}</div>
            </div>
          )}

          {getFileExtension(note.document) ===
            SupportedFileExtension.EXTENSION_PDF && (
            <div className="flex flex-col">
              <div className="sticky top-0 z-2 flex bg-primary-1000 text-white p-2 justify-start">
                {numPages && (
                  <div className="flex space-x-2 items-center">
                    <p className="text-xs">
                      {pageNumber} / {numPages}
                    </p>
                    <button
                      className="text-xs"
                      disabled={pageNumber === 1}
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    >
                      Précedente
                    </button>
                    <button
                      className="text-xs"
                      disabled={pageNumber === numPages}
                      onClick={() =>
                        setPageNumber((p) => Math.min(numPages!, p + 1))
                      }
                    >
                      Suivante
                    </button>
                  </div>
                )}
              </div>
              <div>
                <Document
                  file={`${note.document.file}`}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page
                    width={770}
                    renderAnnotationLayer={false}
                    pageNumber={pageNumber}
                  />
                </Document>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
