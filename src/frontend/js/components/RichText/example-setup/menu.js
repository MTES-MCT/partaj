import {
  wrapItem,
  blockTypeItem,
  joinUpItem,
  liftItem,
  undoItem,
  redoItem,
  icons,
  MenuItem,
} from 'prosemirror-menu';
import { toggleMark } from 'prosemirror-commands';
import { wrapInList } from 'prosemirror-schema-list';

// Helpers to create specific types of items
function cmdItem(cmd, options) {
  let passedOptions = {
    label: options.title,
    run: cmd,
  };
  for (let prop in options) passedOptions[prop] = options[prop];
  if ((!options.enable || options.enable === true) && !options.select)
    passedOptions[options.enable ? 'enable' : 'select'] = (state) => cmd(state);

  return new MenuItem(passedOptions);
}

function markActive(state, type) {
  let { from, $from, to, empty } = state.selection;
  if (empty) return type.isInSet(state.storedMarks || $from.marks());
  else return state.doc.rangeHasMark(from, to, type);
}

function markItem(markType, options) {
  let passedOptions = {
    active(state) {
      return markActive(state, markType);
    },
    enable: true,
  };
  for (let prop in options) passedOptions[prop] = options[prop];
  return cmdItem(toggleMark(markType), passedOptions);
}

function wrapListItem(nodeType, options) {
  return cmdItem(wrapInList(nodeType, options.attrs), options);
}

// :: (Schema) → Object
// Given a schema, look for default mark and node types in it and
// return an object with relevant menu items relating to those marks:
//
// **`toggleStrong`**`: MenuItem`
//   : A menu item to toggle the [strong mark](#schema-basic.StrongMark).
//
// **`toggleEm`**`: MenuItem`
//   : A menu item to toggle the [emphasis mark](#schema-basic.EmMark).
//
// **`wrapBulletList`**`: MenuItem`
//   : A menu item to wrap the selection in a [bullet list](#schema-list.BulletList).
//
// **`wrapOrderedList`**`: MenuItem`
//   : A menu item to wrap the selection in an [ordered list](#schema-list.OrderedList).
//
// **`wrapBlockQuote`**`: MenuItem`
//   : A menu item to wrap the selection in a [block quote](#schema-basic.BlockQuote).
//
// **`makeParagraph`**`: MenuItem`
//   : A menu item to set the current textblock to be a normal
//     [paragraph](#schema-basic.Paragraph).
//
// **`makeHead[N]`**`: MenuItem`
//   : Where _N_ is 1 to 6. Menu items to set the current textblock to
//     be a [heading](#schema-basic.Heading) of level _N_.
//
// The return value also contains some prefabricated menu elements and
// menus, that you can use instead of composing your own menu from
// scratch:
//
// **`typeMenu`**`: Dropdown`
//   : A dropdown containing the items for making the current
//     textblock a paragraph, code block, or heading.
//
// **`fullMenu`**`: [[MenuElement]]`
//   : An array of arrays of menu elements for use as the full menu
//     for, for example the [menu bar](https://github.com/prosemirror/prosemirror-menu#user-content-menubar).
export function buildMenuItems(schema) {
  const r = {};

  if (schema.marks.strong) {
    r.toggleStrong = markItem(schema.marks.strong, {
      title: 'Toggle strong style',
      icon: icons.strong,
    });
  }

  if (schema.marks.em) {
    r.toggleEm = markItem(schema.marks.em, {
      title: 'Toggle emphasis',
      icon: icons.em,
    });
  }

  if (schema.nodes.bullet_list) {
    r.wrapBulletList = wrapListItem(schema.nodes.bullet_list, {
      title: 'Wrap in bullet list',
      icon: icons.bulletList,
    });
  }

  if (schema.nodes.ordered_list) {
    r.wrapOrderedList = wrapListItem(schema.nodes.ordered_list, {
      title: 'Wrap in ordered list',
      icon: icons.orderedList,
    });
  }

  if (schema.nodes.blockquote) {
    r.wrapBlockQuote = wrapItem(schema.nodes.blockquote, {
      title: 'Wrap in block quote',
      icon: icons.blockquote,
    });
  }

  if (schema.nodes.heading) {
    for (let i = 1; i <= 10; i++) {
      r['makeHead' + i] = blockTypeItem(schema.nodes.heading, {
        title: 'Change to heading ' + i,
        label: 'H' + i,
        attrs: { level: i },
      });
    }

    // Only add paragraphs to the menu if there are heading levels. Otherwise it does not
    // do anything
    if (schema.nodes.paragraph) {
      r.makeParagraph = blockTypeItem(schema.nodes.paragraph, {
        title: 'Change to paragraph',
        label: 'P',
      });
    }
  }

  let cut = (arr) => arr.filter((x) => x);

  r.inlineMenu = [cut([r.toggleStrong, r.toggleEm])];

  if (r.makeParagraph) {
    r.typeMenu = [
      cut([
        r.makeParagraph,
        r.makeHead1,
        r.makeHead2,
        r.makeHead3,
        r.makeHead4,
        r.makeHead5,
        r.makeHead6,
      ]),
    ];
  }

  r.blockMenu = [
    cut([
      r.wrapBulletList,
      r.wrapOrderedList,
      r.wrapBlockQuote,
      joinUpItem,
      liftItem,
    ]),
  ];

  r.fullMenu = r.inlineMenu.concat(
    r.typeMenu || [],
    [[undoItem, redoItem]],
    r.blockMenu,
  );

  return r;
}
