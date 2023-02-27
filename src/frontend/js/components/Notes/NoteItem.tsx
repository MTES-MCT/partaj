import React, { useState } from 'react';

import { NoteLite, NoteHighlightKeys } from '../../types';
import { NotePreviewModal } from './NotePreviewModal';
import ReactHtmlParser from 'react-html-parser';
import {
  ChevronRightIcon,
  DownloadIcon,
  EyeIcon,
  IconColor,
  OpenNewTabIcon,
  QuoteIcon,
} from '../Icons';
import { FormattedDate } from 'react-intl';
import { NavLink } from 'react-router-dom';

export const NoteItem: React.FC<{ note: NoteLite }> = ({
  note,
}: {
  note: NoteLite;
}) => {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col rounded shadow-blur w-full overflow-hidden mb-6 bg-white border">
      <div className="flex justify-between shadow-s-bottom px-2">
        <div className="flex">
          <div className="flex w-16 justify-center items-center">
            <span className="text-xl font-medium">
              {note._source.case_number}
            </span>
          </div>
          <div className="flex flex-col justify-between py-1 px-2">
            <div className="font-medium"> {note._source.topic} </div>
            <div className="flex font-light text-sm items-center">
              {note._source.assigned_units_names.map((name) => (
                <span>{name}</span>
              ))}
              <ChevronRightIcon color={IconColor.BLACK} />
              {note._source.requesters_unit_names.map((name) => (
                <span>{name}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button
            className="button button-white"
            onClick={(e) => {
              setModalOpen(true);
            }}
          >
            <EyeIcon size={6} color={IconColor.BLACK} />
          </button>
          <a
            className="button button-white"
            href={note._source.document.file}
            key={`downlaod-${note._source.document.id}`}
          >
            <DownloadIcon size={6} color={IconColor.BLACK} />
          </a>
          <NavLink
            className="button button-white"
            to={`/notes/${note._id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <OpenNewTabIcon size={6} color={IconColor.BLACK} />
          </NavLink>
        </div>
      </div>
      <div className="flex py-4 px-2">
        <div className="flex flex-grow rounded-sm p-2 bg-primary-50">
          {note._source.object}
        </div>
      </div>
      <>
        {note.highlight && (
          <div className="flex px-2">
            <div className="flex items-start">
              <QuoteIcon size={8} color={IconColor.BLACK} />
            </div>
            <div className="flex flex-grow p-3 text-sm">
              {NoteHighlightKeys.TEXT in note.highlight && (
                <div className="flex flex-col space-y-2">
                  {note.highlight[NoteHighlightKeys.TEXT].map((highlight) => {
                    return (
                      <span>[...] {ReactHtmlParser(highlight)} [...]</span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </>
      <div className="flex px-4 py-2 justify-between text-sm text-purple-550 border border-top border-gray-200">
        <span>Rédigé par {note._source.author}</span>
        <span>
          <FormattedDate value={note._source.publication_date} />
        </span>
      </div>

      <NotePreviewModal
        note={note}
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
      />
    </div>
  );
};
