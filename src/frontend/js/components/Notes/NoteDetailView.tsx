import React, { useEffect, useState } from 'react';

import { useNoteDetailsAction } from '../../data/notes';
import { Note, SupportedFileExtension } from '../../types';
import { Nullable } from '../../types/utils';
import { getFileExtension } from '../../utils/string';
import ReactHtmlParser from 'react-html-parser';
import { Document, Page, pdfjs } from 'react-pdf';
import { useParams } from 'react-router-dom';
import { DownloadIcon, IconColor } from '../Icons';
import { useCurrentUser } from '../../data/useCurrentUser';

export interface NoteRouteParams {
  noteId: string;
}
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export const NoteDetailView: React.FC = () => {
  const { noteId } = useParams<NoteRouteParams>();
  const [note, setNote] = useState<Nullable<Note>>(null);
  const [numPages, setNumPages] = useState<Nullable<number>>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };
  const { currentUser } = useCurrentUser();

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
    <>
      {currentUser && currentUser.has_db_access && (
        <div className="flex flex-grow justify-center">
          {notesMutation.isSuccess && note && (
            <div className="relative w-full border max-w-800">
              {getFileExtension(note.document) ===
                SupportedFileExtension.EXTENSION_DOCX && (
                <div>
                  <div className="sticky top-0 z-2 flex bg-primary-1000 text-white p-2 justify-between">
                    <div className="flex w-full justify-end">
                      <a
                        className="button button-primary-1000 flex"
                        href={note.document.file}
                        key={`downlaod-${note.document.id}`}
                      >
                        <DownloadIcon size={4} color={IconColor.WHITE} />
                      </a>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="p-10 bg-white">
                      {ReactHtmlParser(note.html)}
                    </div>
                  </div>
                </div>
              )}

              {getFileExtension(note.document) ===
                SupportedFileExtension.EXTENSION_PDF && (
                <div className="flex flex-col">
                  <div className="sticky top-0 z-2 flex bg-primary-1000 text-white p-2">
                    {numPages && (
                      <div className="flex w-full justify-between">
                        <div className="flex space-x-2 items-center">
                          <p className="text-xs">
                            Page {pageNumber} / {numPages}
                          </p>
                          <div className="space-x-2">
                            {numPages > 1 && (
                              <>
                                <button
                                  className="text-xs"
                                  disabled={pageNumber === 1}
                                  onClick={() =>
                                    setPageNumber((p) => Math.max(1, p - 1))
                                  }
                                >
                                  Précedente
                                </button>
                                <button
                                  className="text-xs"
                                  disabled={pageNumber === numPages}
                                  onClick={() =>
                                    setPageNumber((p) =>
                                      Math.min(numPages!, p + 1),
                                    )
                                  }
                                >
                                  Suivante
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <a
                          className="button button-primary-1000"
                          href={note.document.file}
                          key={`downlaod-${note.document.id}`}
                        >
                          <DownloadIcon size={4} color={IconColor.WHITE} />
                        </a>
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
      )}
    </>
  );
};
