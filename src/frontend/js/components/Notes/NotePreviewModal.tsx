import React, { useState } from 'react';

import { ModalContainer, ModalSize } from '../modals/ModalContainer';
import ReactHtmlParser from 'react-html-parser';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack5';
import { Nullable } from '../../types/utils';

interface NotePreviewModalProps {
  html: string;
  file: string;
  isModalOpen: boolean;
  setModalOpen: any;
}

export const NotePreviewModal: React.FC<NotePreviewModalProps> = ({
  html,
  file,
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
        >
          <div>
            <Document
              file={`http://127.0.0.1:8080${file}`}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              <Page pageNumber={pageNumber} />
            </Document>
            <p>
              Page {pageNumber} of {numPages}
            </p>
            <div className="p-10">{ReactHtmlParser(html)}</div>
          </div>
        </ModalContainer>
      )}
    </>
  );
};
