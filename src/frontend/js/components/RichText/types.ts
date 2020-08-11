interface BaseSerializablePMNode {
  type: string;
}

type SerializablePMNode = SerializablePMBlockNode | SerializablePMInlineNode;

type BlockNodeType =
  | 'blockquote'
  | 'bullet_list'
  | 'doc'
  | 'heading'
  | 'list_item'
  | 'ordered_list'
  | 'paragraph';
const blockNodeTypes = [
  'blockquote',
  'bullet_list',
  'doc',
  'heading',
  'list_item',
  'ordered_list',
  'paragraph',
];

export interface SerializablePMHeadingNode extends BaseSerializablePMNode {
  attrs: {
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
  content?: SerializablePMNode[];
  type: 'heading';
}

interface SerializablePMGenericBlockNode extends BaseSerializablePMNode {
  content?: SerializablePMNode[];
  type: BlockNodeType;
}

export type SerializablePMBlockNode =
  | SerializablePMHeadingNode
  | SerializablePMGenericBlockNode;

export const isBlockNode = (
  node: SerializablePMNode,
): node is SerializablePMBlockNode => {
  return blockNodeTypes.includes(node.type);
};

type InlineNodeType = 'text';
const inlineBlockTypes = ['text'];

interface EmphasisMark {
  type: 'em';
}
interface StrongMark {
  type: 'strong';
}

type InlineNodeMark = EmphasisMark | StrongMark;

export interface SerializablePMInlineNode extends BaseSerializablePMNode {
  marks?: InlineNodeMark[];
  text: string;
  type: InlineNodeType;
}

export interface SerializableState {
  doc: SerializablePMBlockNode;
  selection?: unknown;
}
