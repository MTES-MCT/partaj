import React, { Fragment, useState } from 'react';

import { NoteLite, NoteHighlightKeys } from '../../types';
import { NotePreviewModal } from './NotePreviewModal';
import ReactHtmlParser from 'react-html-parser';
import {
  ChevronRightIcon,
  DownloadIcon,
  EyeIcon,
  OpenNewTabIcon,
  QuoteIcon,
} from '../Icons';
import { defineMessages, FormattedDate, useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';
import { getLastItem } from '../../utils/string';
import { useUIDSeed } from 'react-uid';
import { useContext } from 'react';
import { AssociatedReferralsModalContent } from './AssociatedReferralsModalContent';
import { BaseSideModalContext } from '../../data/providers/BaseSideModalProvider';

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

export const NoteItem: React.FC<{
  note: NoteLite;
  page?: 'knowledge_database' | 'referral';
}> = ({ note, page = 'knowledge_database' }) => {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const seed = useUIDSeed();
  const intl = useIntl();
  const { openBaseSideModal } = useContext(BaseSideModalContext);

  const handleSiblingsClick = () => {
    openBaseSideModal({
      title: 'Base de connaissances',
      width: 'max-w-4xl',
      height: 'h-full',
      content: <AssociatedReferralsModalContent />,
    });
  };

  const isQuickViewable = () => {
    return ['knowledge_database'].includes(page);
  };

  const isNewTabOpenable = () => {
    return ['knowledge_database', 'referral'].includes(page);
  };

  const isDownloadable = () => {
    return ['knowledge_database', 'referral'].includes(page);
  };

  return (
    <div className="flex flex-col w-full mb-6 pb-2 bg-white border space-y-2 border-dsfr-grey-200">
      <div className="flex justify-between">
        <div className="flex flex-grow text-sm p-2 bg-primary-50 text-left">
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
        </div>
        <div className="flex items-center ml-2">
          {isQuickViewable() && (
            <button
              className="button button-white tooltip tooltip-action"
              aria-label={intl.formatMessage(messages.previewActionTooltip)}
              data-tooltip={intl.formatMessage(messages.previewActionTooltip)}
              onClick={(e) => {
                setModalOpen(true);
              }}
            >
              <EyeIcon
                className="w-6 h-6 fill-dsfr-primary-500"
                label={intl.formatMessage(messages.previewActionTooltip)}
              />
            </button>
          )}
          {isDownloadable() && (
            <a
              className="button button-white tooltip tooltip-action"
              data-tooltip={intl.formatMessage(messages.downloadActionTooltip)}
              href={note._source.document.file}
              key={`download-${note._source.document.id}`}
            >
              <DownloadIcon
                className="w-6 h-6 fill-dsfr-primary-500"
                label={intl.formatMessage(messages.downloadActionTooltip)}
              />
            </a>
          )}

          {isNewTabOpenable() && (
            <NavLink
              className="button button-white tooltip tooltip-action"
              data-tooltip={intl.formatMessage(messages.newTabActionTooltip)}
              to={`/notes/${note._source.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <OpenNewTabIcon
                className="w-6 h-6 fill-dsfr-primary-500"
                label={intl.formatMessage(messages.newTabActionTooltip)}
              />
            </NavLink>
          )}
        </div>
      </div>
      <>
        {note.highlight && note.highlight[NoteHighlightKeys.TEXT] && (
          <div className="flex px-2">
            <div className="flex items-start">
              <QuoteIcon className="w-8 h-8 fill-black" />
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
          <>
            {note._source.siblings.length > 0 && (
              <button
                onClick={handleSiblingsClick}
                className="flex justify-start w-full space-x-1 text-left hover:bg-gray-50 p-1 rounded cursor-pointer transition-colors"
              >
                <span>Saisines associées :</span>
                <>
                  {note._source.siblings.map((sibling: number) => (
                    <span key={sibling}> #{sibling}</span>
                  ))}
                </>
              </button>
            )}
          </>
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
                  {index > 0 && <span className="mr-1 mb-0.5">,</span>}
                  <span className="mb-0.5">{getLastItem(name, '/')}</span>
                </Fragment>
              ))}
              <ChevronRightIcon className="fill-black" />
              {[...new Set(note._source.requesters_unit_names)].map(
                (name, index) => (
                  <Fragment key={name}>
                    {index > 0 && <span className="mr-1 mb-0.5">,</span>}
                    <span className="mb-0.5">
                      {name.split('/').slice(0, 3).join('/')}
                    </span>
                  </Fragment>
                ),
              )}
            </div>
            <div className="flex flex-col items-end text-purple-550 text-xs">
              <span>
                <FormattedDate value={note._source.publication_date} />
              </span>
            </div>
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
