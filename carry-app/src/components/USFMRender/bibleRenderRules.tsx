/* eslint-disable */
// @ts-nocheck
import _ from 'lodash'
import React from 'react'
import { getRootID } from '@shared/Utils'
import { Text, H2, H3 } from '@components/Typography'
import getUniqueID from './utils/getUniqueID'
import Chapter from './components/Chapter'
import Footnote from './components/Footnote'
import Paragraph from './components/Paragraph'
import Verse from './components/Verse'
import Wordlist from './components/Wordlist'
import SectionHeading from './components/SectionHeading'

const setRef = (c, refs) => {
  if (c && c.props && c.props.rootID) refs[c.props.rootID] = c
  if (c && c.addChats) refs[`paragraph_${Object.values(refs).length}`] = c

  return c
}

const renderParagraph = (node, children, parent, styles, handler, quickNav, refs, transVersion, type: string, bookId, chapterId) => (
  <Paragraph
    ref={c => setRef(c, refs)}
    key={`${type}_${_.first(node.content).id}`}
    showQuickNavigation={quickNav}
    fromVerse={_.first(node.content).num}
    toVerse={_.last(node.content).num}
    fromRootID={getRootID(bookId, chapterId, _.first(node.content).id)}
    toRootID={getRootID(bookId, chapterId, _.last(node.content).id)}
    onNavPress={handler}
    type={type}
  >
    {children}
  </Paragraph>
)

const renderRules = {
  // when unknown elements are introduced, so it wont break
  unknown: () => {},

  p: (node, children, parent, styles, handler, refs, { showQuickNav, transVersion, bookId, chapterId }) =>
    renderParagraph(node, children, parent, styles, handler, showQuickNav, refs, transVersion, 'p', bookId, chapterId),

  pm: (node, children, parent, styles, handler, refs, { showQuickNav, transVersion, bookId, chapterId }) =>
    renderParagraph(node, children, parent, styles, handler, showQuickNav, refs, transVersion, 'pm', bookId, chapterId),

  po: (node, children, parent, styles, handler, refs, { showQuickNav, transVersion, bookId, chapterId }) =>
    renderParagraph(node, children, parent, styles, handler, showQuickNav, refs, transVersion, 'po', bookId, chapterId),

  pi1: (node, children, parent, styles, handler, refs, { showQuickNav, transVersion, bookId, chapterId }) =>
    renderParagraph(node, children, parent, styles, handler, showQuickNav, refs, transVersion, 'pi1', bookId, chapterId),

  pr: (node, children, parent, styles, handler, refs, { showQuickNav, transVersion, bookId, chapterId }) =>
    renderParagraph(node, children, parent, styles, handler, showQuickNav, refs, transVersion, 'pr', bookId, chapterId),

  li1: (node, children, parent, styles, handler, refs, { showQuickNav, bookId, chapterId }) => {
    if (node.content)
      return (
        <Paragraph
          ref={c => setRef(c, refs)}
          key={`li1_${_.first(node.content).id}`}
          showQuickNavigation={showQuickNav}
          fromVerse={_.first(node.content).num}
          toVerse={_.last(node.content).num}
          fromRootID={getRootID(bookId, chapterId, _.first(node.content).id)}
          toRootID={getRootID(bookId, chapterId, _.last(node.content).id)}
          onNavPress={handler}
        >
          {children}
        </Paragraph>
      )

    return (
      <Text key={`br_${node.id}_${getUniqueID()}`} style={styles.paragraph}>
        {'\n'}
        {children}
      </Text>
    )
  },

  m: (node, children, parent, styles, handler, refs, { showQuickNav, transVersion }) =>
    renderParagraph(node, children, parent, styles, handler, showQuickNav, refs, transVersion, 'm'),

  mi: (node, children, parent, styles, handler, refs, { showQuickNav, transVersion }) =>
    renderParagraph(node, children, parent, styles, handler, showQuickNav, refs, transVersion, 'm1'),

  nb: (node, children, parent, styles, handler, refs, { showQuickNav, transVersion }) =>
    renderParagraph(node, children, parent, styles, handler, showQuickNav, refs, transVersion, 'p'),

  q1_p: (node, children, parent, styles, handler, refs, { showQuickNav, transVersion, bookId, chapterId }) => {
    if (node.content)
      return (
        <Paragraph
          ref={c => setRef(c, refs)}
          key={`q1_p_${_.first(node.content).id}`}
          showQuickNavigation={showQuickNav}
          fromVerse={_.first(node.content).num}
          toVerse={_.last(node.content).num}
          fromRootID={getRootID(bookId, chapterId, _.first(node.content).id)}
          toRootID={getRootID(bookId, chapterId, _.last(node.content).id)}
          onNavPress={handler}
          type={'q1_p'}
          noBreak
        >
          {children}
        </Paragraph>
      )

    return (
      <Text key={`br_${node.id}_${getUniqueID()}`} style={styles.paragraph}>
        {'\n'}
        {children}
      </Text>
    )
  },

  // // New line
  // br: (node, children, parent, styles, handler) => (
  //   <Text key={`br_${node.id}_${getUniqueID()}`} style={styles.paragraph}>
  //     {'\n'}
  //     {children}
  //   </Text>
  // ),

  h: node => <Text key={node.id}>{node.text}</Text>,

  // Chapter
  c: node => <Chapter key={`c_${node.id}`} chapter={node.num} content={node} text={node.text} />,

  // Verse
  v: (node, children, parent, styles, handler, refs, { bookId, chapterId }) => {
    return (
      <Verse
        ref={c => setRef(c, refs)}
        key={`verse_${node.id}`}
        rootID={getRootID(bookId, chapterId, node.num)}
        onPress={handler}
        verse={node.num}
        style={styles.verse}
      >
        {children}
      </Verse>
    )
  },

  text: (node, children, parent, styles, handler) => node,
  // <RNText style={styles.text} key={getUniqueID()} suppressHighlighting>
  // node,
  // </RNText>

  it: (node, children, parent, styles, handler) => (
    <Text style={{ ...styles.text, fontStyle: 'italic' }} key={getUniqueID()}>
      {children}
    </Text>
  ),
  tl: (node, children, parent, styles, handler) => (
    <Text style={{ fontStyle: 'italic' }} key={getUniqueID()}>
      {children}
    </Text>
  ),

  d: (node, children, parent, styles, handler) => (
    <Text style={styles.d} key={getUniqueID()}>
      {`\n`}
      {children}
    </Text>
  ),

  add: (node, children, parent, styles, handler) => (
    <Text style={{ fontStyle: 'italic' }} key={getUniqueID()}>
      {children}{' '}
    </Text>
  ),

  '+add': (node, children, parent, styles, handler) => (
    <Text style={{ fontStyle: 'italic' }} key={getUniqueID()}>
      {children}{' '}
    </Text>
  ),

  bdit: (node, children, parent, styles, handler) => (
    <Text style={{ fontStyle: 'italic', fontWeight: 'bold' }} key={getUniqueID()}>
      {children}{' '}
    </Text>
  ),

  '+bdit': (node, children, parent, styles, handler) => (
    <Text style={{ fontStyle: 'italic', fontWeight: 'bold' }} key={getUniqueID()}>
      {children}{' '}
    </Text>
  ),

  s3: (node, children, parent, styles, handler) => (
    <SectionHeading level={0} style={styles[node.type]}>
      {children}
    </SectionHeading>
  ),

  s1: (node, children, parent, styles, handler) => (
    <SectionHeading level={1} style={styles[node.type]}>
      {children}
    </SectionHeading>
  ),
  s2: (node, children, parent, styles, handler) => (
    <SectionHeading level={2} style={styles[node.type]}>
      {children}
    </SectionHeading>
  ),

  wj: (node, children, parent, styles) => {
    return (
      <Text key={getUniqueID()} color="jesusWords" style={{ ...styles.wj, ...styles.text }}>
        {children}
      </Text>
    )
  },

  nd: (node, children, parent, styles) => {
    const first = node.value[0].slice(0, 1)
    const rest = node.value[0].slice(1)
    return (
      <Text key={getUniqueID()} style={styles.nd}>
        <Text style={{ textTransform: 'uppercase' }}>{first}</Text>
        <Text style={{ textTransform: 'lowercase' }}>{`${rest} `}</Text>
      </Text>
    )
  },

  '+nd': (node, children, parent, styles) => {
    return (
      <Text key={getUniqueID()} style={styles.nd}>
        {`${node.value[0]} `}
      </Text>
    )
  },

  w: (node, children, parent, styles, handler) => <Wordlist key={getUniqueID()} value={node.value} style={styles.verse} />,

  pc: (_node, children, _parent, _styles, _handler) => <Text key={getUniqueID()}> {children}</Text>,
  pi2: () => <Text key={getUniqueID()}>{`\n`}</Text>,
  pi3: () => <Text key={getUniqueID()}>{`\n`}</Text>,
  pmc: () => <Text key={getUniqueID()}>{`\n`}</Text>,
  pmo: () => <Text key={getUniqueID()}>{`\n`}</Text>,
  pmr: () => <Text key={getUniqueID()}>{`\n   `}</Text>,

  /**
   *
   * Table tags
   *
   */
  tr: (node, children, parent, styles, handler) => <Text key={getUniqueID()}>{`\n`}</Text>,
  tc1: (node, children, parent, styles, handler) => <Text key={getUniqueID()}>{`\t`}</Text>,
  tcr2: (node, children, parent, styles, handler) => (
    <Text style={{ fontStyle: 'italic' }} key={getUniqueID()}>
      {children}
    </Text>
  ),

  /**
   *
   * LIST tags
   *
   */

  li2: () => <Text key={getUniqueID()}>{`\n\t`}</Text>,
  li3: () => <Text key={getUniqueID()}>{`\n\t`}</Text>,
  li4: () => <Text key={getUniqueID()}>{`\n\t`}</Text>,

  /**
   *
   * POETRY tags
   *
   */
  q1: () => <Text key={getUniqueID()}>{`\n`}</Text>,
  q2: () => <Text key={getUniqueID()}>{`\n\t  `}</Text>,
  q3: () => <Text key={getUniqueID()}>{`\n\t  `}</Text>,
  q4: () => <Text key={getUniqueID()}>{`\n\t  `}</Text>,

  qm1: (node, children, parent, styles, handler) => (
    <Text key={getUniqueID()} style={{ fontStyle: 'italic' }}>
      {`\n`}
      {children}
    </Text>
  ),

  qm2: (node, children, parent, styles, handler) => (
    <Text key={getUniqueID()} style={{ fontStyle: 'italic' }}>
      {`\n\t  `}
      {children}
    </Text>
  ),

  qr: (node, children, parent, styles, handler) => (
    <Text key={getUniqueID()} style={{ textAlign: 'right', fontStyle: 'italic' }}>
      {`\n`}
      {children}
      {`\n`}
    </Text>
  ),

  qc: (node, children, parent, styles, handler) => (
    <Text key={getUniqueID()} style={{ textAlign: 'center' }}>
      {`\n${node.content}\n`}
    </Text>
  ),

  qs: (node, children, parent, styles, handler) => (
    <Text key={getUniqueID()} style={{ textAlign: 'right', fontStyle: 'italic' }}>
      {`\n${node.value}`}
    </Text>
  ),

  qt: (node, children, parent, styles, handler) => (
    <Text key={getUniqueID()} style={{ textAlign: 'center', fontStyle: 'italic' }}>
      {`\n${children}`}
    </Text>
  ),

  qa: (node, children, parent, styles, handler) => (
    <H2 key={getUniqueID()} style={{ textAlign: 'center', fontStyle: 'italic', fontWeight: 'bold' }}>
      {`\n${node.content}`}
    </H2>
  ),

  qac: (node, children, parent, styles, handler) => (
    <Text key={getUniqueID()} style={{ fontStyle: 'italic', fontWeight: '500' }}>
      {`\n${node.value}`}
    </Text>
  ),

  qd: (node, children, parent, styles, handler) => (
    <Text key={getUniqueID()} style={{ fontStyle: 'italic' }}>
      {`\n${node.value}`}
    </Text>
  ),

  sc: (node, children, parent, styles, handler) => (
    <Text key={getUniqueID()} style={{ textTransform: 'uppercase' }}>
      {children}
    </Text>
  ),

  sp: (node, children, parent, styles, _handler) => (
    <H3 key={getUniqueID()} style={{ fontWeight: 'bold' }}>
      {`\n\n`}
      {children}
    </H3>
  ),

  b: (node, children, parent, styles, _handler) => <Text key={getUniqueID()}>{`\n`}</Text>,

  /**
   *
   * FOOTNOTE tags
   *
   */
  // ft, fr are rendered inside f
  f: (node, children, parent, styles, _handler) => <Footnote style={styles.text} key={getUniqueID()} value={node.value} />,

  /**
   *
   * TITLES, HEADINGS and LABELS tags
   *
   */
  mt1: (node, children, parent, styles, _handler) => (
    <H2 key={getUniqueID()} style={styles.mt1}>
      {node.content}
    </H2>
  ),
  mt2: (node, children, parent, styles, handler) => (
    <H2
      key={getUniqueID()}
      style={{
        fontWeight: '400',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: -5,
        // textTransform: 'uppercase',
      }}
    >
      {node.content}
    </H2>
  ),
}

export default renderRules
