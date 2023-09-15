import React, { Fragment, useState } from 'react';

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
import { defineMessages, FormattedDate, useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';
import { getLastItem } from '../../utils/string';
import { useUIDSeed } from 'react-uid';

const messages = defineMessages({
  previewActionTooltip: {
    defaultMessage: 'View the notice',
    description: 'Preview button tooltip text',
    id: 'components.NoteItem.previewActionTooltip',
  },
  downloadActionTooltip: {
    defaultMessage: 'Download the notice',
    description: 'Download button tooltip text',
    id: 'components.NoteItem.downloadActionTooltip',
  },
  newTabActionTooltip: {
    defaultMessage: 'Open the notice in new tab',
    description: 'New tab open button tooltip text',
    id: 'components.NoteItem.newTabActionTooltip',
  },
});

export const NoteItem: React.FC<{ note: NoteLite }> = ({
  note,
}: {
  note: NoteLite;
}) => {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const seed = useUIDSeed();
  const intl = useIntl();

  return (
    <div className="flex flex-col rounded shadow-blur w-full mb-6 bg-white border p-2 space-y-2">
      <div className="flex justify-between">
        <button
          onClick={(e) => {
            setModalOpen(true);
          }}
          className="cursor-pointer flex flex-grow text-sm rounded-sm p-2 bg-primary-50"
        >
          <span>
            {note.highlight && note.highlight[NoteHighlightKeys.ID] ? (
              <>{ReactHtmlParser(note.highlight[NoteHighlightKeys.ID][0])}</>
            ) : (
              <>{note._source.referral_id}</>
            )}
            {' - '}
            {note.highlight && note.highlight[NoteHighlightKeys.OBJECT] ? (
              <>
                {ReactHtmlParser(note.highlight[NoteHighlightKeys.OBJECT][0])}
              </>
            ) : (
              <>{note._source.object}</>
            )}
          </span>
        </button>
        <div className="flex items-center ml-2">
          <button
            className="button button-white tooltip tooltip-action"
            data-tooltip={intl.formatMessage(messages.previewActionTooltip)}
            onClick={(e) => {
              setModalOpen(true);
            }}
          >
            <EyeIcon
              size={6}
              color={IconColor.BLACK}
              label={intl.formatMessage(messages.previewActionTooltip)}
            />
          </button>
          <a
            className="button button-white tooltip tooltip-action"
            data-tooltip={intl.formatMessage(messages.downloadActionTooltip)}
            href={note._source.document.file}
            key={`downlaod-${note._source.document.id}`}
          >
            <DownloadIcon
              size={6}
              color={IconColor.BLACK}
              label={intl.formatMessage(messages.downloadActionTooltip)}
            />
          </a>
          <NavLink
            className="button button-white tooltip tooltip-action"
            data-tooltip={intl.formatMessage(messages.newTabActionTooltip)}
            to={`/notes/${note._source.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <OpenNewTabIcon
              size={6}
              color={IconColor.BLACK}
              label={intl.formatMessage(messages.newTabActionTooltip)}
            />
          </NavLink>
        </div>
      </div>
      <>
        {note.highlight && note.highlight[NoteHighlightKeys.TEXT] && (
          <div className="flex px-2">
            <div className="flex items-start">
              <QuoteIcon size={8} color={IconColor.BLACK} />
            </div>
            <div className="flex flex-grow p-3 text-s">
              {NoteHighlightKeys.TEXT in note.highlight && (
                <div className="flex flex-col space-y-2">
                  {note.highlight[NoteHighlightKeys.TEXT].map((highlight) => (
                    <span key={seed(highlight)}>
                      [...] {ReactHtmlParser(highlight)} [...]
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </>
      <div className="flex">
        <div className="flex flex-col flex-grow px-2 text-s">
          <div className="flex justify-start w-full">
            <span>
              {note.highlight && note.highlight[NoteHighlightKeys.TOPIC] ? (
                <>
                  {ReactHtmlParser(note.highlight[NoteHighlightKeys.TOPIC][0])}
                </>
              ) : (
                <>{note._source.topic}</>
              )}
            </span>
          </div>
          <div className="flex justify-between w-full">
            <div className="flex font-light items-end flex-wrap">
              {note._source.assigned_units_names.map((name, index) => (
                <Fragment key={name}>
                  {index > 0 && <span className="mr-1">,</span>}
                  <span>{getLastItem(name, '/')}</span>
                </Fragment>
              ))}
              <ChevronRightIcon color={IconColor.BLACK} />
              {[...new Set(note._source.requesters_unit_names)].map(
                (name, index) => (
                  <Fragment key={name}>
                    {index > 0 && <span className="mr-1">,</span>}
                    <span>{name.split('/').slice(0, 3).join('/')}</span>
                  </Fragment>
                ),
              )}
            </div>
            <span className="flex items-end text-purple-550 text-xs">
              <FormattedDate value={note._source.publication_date} />
            </span>
          </div>
        </div>
      </div>

      <NotePreviewModal
        note={note}
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
      />
    </div>
  );
};
