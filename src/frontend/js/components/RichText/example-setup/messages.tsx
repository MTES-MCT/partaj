import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  joinUpItem: {
    defaultMessage: 'Join with above block',
    description:
      'Tooltip for the button to join the current block with the one above in the rich text editor',
    id: 'components.RichText.editor.joinUpItem',
  },
  liftItem: {
    defaultMessage: 'Lift out of enclosing block',
    description:
      'Tooltip for the button to lift out the current block in the rich text editor',
    id: 'components.RichText.editor.liftItem',
  },
  makeHeading: {
    defaultMessage: 'Turn into a level {level} heading',
    description: 'Tooltip for the heading buttons in the rich text editor',
    id: 'components.RichText.editor.makeHeading',
  },
  makeParagraph: {
    defaultMessage: 'Turn into a paragraph',
    description: 'Tooltip for the paragraph button in the rich text editor',
    id: 'components.RichText.editor.makeParagraph',
  },
  redoItem: {
    defaultMessage: 'Redo last undone change',
    description: 'Tooltip for redo button in the rich text editor',
    id: 'components.RichText.editor.redoItem',
  },
  toggleBlockquote: {
    defaultMessage: 'Create a block quote',
    description: 'Tooltip for the blockquote button in the rich text editor',
    id: 'components.RichText.editor.toggleBlockquote',
  },
  toggleBulletList: {
    defaultMessage: 'Create a bullet list',
    description: 'Tooltip for the bullet list button in the rich text editor',
    id: 'components.RichText.editor.toggleBulletList',
  },
  toggleEmphasis: {
    defaultMessage: 'Toggle emphasis',
    description: 'Tooltip for emphasis font button in the rich text editor',
    id: 'components.RichText.editor.toggleEmphasis',
  },
  toggleOrderedList: {
    defaultMessage: 'Create an ordered list',
    description: 'Tooltip for the ordered list button in the rich text editor',
    id: 'components.RichText.editor.toggleOrderedList',
  },
  toggleStrong: {
    defaultMessage: 'Toggle bold',
    description: 'Tooltip for bold font button in the rich text editor',
    id: 'components.RichText.editor.toggleStrong',
  },
  toggleUnderline: {
    defaultMessage: 'Toggle underline',
    description: 'Tooltip for underline font button in the rich text editor',
    id: 'components.RichText.editor.toggleUnderline',
  },
  undoItem: {
    defaultMessage: 'Undo last change',
    description: 'Tooltip for undo button in the rich text editor',
    id: 'components.RichText.editor.undoItem',
  },
});
