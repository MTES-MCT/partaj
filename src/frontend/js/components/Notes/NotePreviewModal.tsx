import React, { useState } from 'react';

import { ModalContainer, ModalSize } from '../modals/ModalContainer';
import ReactHtmlParser from 'react-html-parser';
import { Document, Page, pdfjs } from 'react-pdf';
import { Nullable } from '../../types/utils';
import { NoteLite, SupportedFileExtension } from '../../types';
import { getFileExtension } from '../../utils/string';
import { DownloadIcon, IconColor } from '../Icons';

interface NotePreviewModalProps {
  note: NoteLite;
  isModalOpen: boolean;
  setModalOpen: any;
}
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export const NotePreviewModal: React.FC<NotePreviewModalProps> = ({
  note,
  isModalOpen,
  setModalOpen,
}: NotePreviewModalProps) => {
  const [numPages, setNumPages] = useState<Nullable<number>>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <>
      {isModalOpen && (
        <ModalContainer
          isModalOpen={isModalOpen}
          setModalOpen={setModalOpen}
          size={ModalSize.XXL}
          style={{
            height: '90%',
            background: '#9e9e9e',
          }}
        >
          <div className="relative">
            {getFileExtension(note._source.document) ===
              SupportedFileExtension.EXTENSION_DOCX && (
              <div>
                <div className="sticky top-0 z-2 flex bg-primary-1000 text-white p-2 justify-between">
                  <div className="flex w-full justify-end">
                    <a
                      className="button button-primary-1000 flex"
                      href={note._source.document.file}
                      key={`downlaod-${note._source.document.id}`}
                    >
                      <DownloadIcon size={4} color={IconColor.WHITE} />
                    </a>
                  </div>
                </div>
                <div className="p-6">{'N/A'}</div>
              </div>
            )}

            {getFileExtension(note._source.document) ===
              SupportedFileExtension.EXTENSION_PDF && (
              <div className="flex flex-col">
                <div className="sticky top-0 z-2 flex bg-primary-1000 text-white p-2 justify-between">
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
                        className="button button-primary-1000 flex"
                        href={note._source.document.file}
                        key={`downlaod-${note._source.document.id}`}
                      >
                        <DownloadIcon size={4} color={IconColor.WHITE} />
                      </a>
                    </div>
                  )}
                </div>
                <div>
                  <Document
                    file={`${window.location.origin}${note._source.document.file}`}
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
        </ModalContainer>
      )}
    </>
  );
};
