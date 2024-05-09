/**
 * @format
 * Paragraph Component
 */
import React, { useRef, useImperativeHandle, forwardRef, memo, useState } from 'react'
import _ from 'lodash'
import { View, StyleSheet } from 'react-native'
import { Text } from '@components/Typography'
import BibleNote from './BibleNote'

type IProps = {
  noBreak?: boolean
  fromVerse: number
  fromRootID: number
  toVerse: number
  toRootID: number
  children: any
  chats: Array<any>
  notes: Array<any>
  type: string
  showQuickNavigation?: boolean
}

const Paragraph: React.ForwardRefRenderFunction<any, IProps> = (props, ref) => {
  const innerRef = useRef(null)
  const chatRefs = useRef({}).current
  const noteRefs = useRef({}).current
  const [chats, setChats] = useState(props.chats || [])
  const [notes, setNotes] = useState(props.notes || [])

  useImperativeHandle(ref, () => ({
    type: 'Paragraph',
    props: {
      noBreak: props.noBreak,
      fromVerse: props.fromVerse,
      toVerse: props.toVerse,

      fromRootID: props.fromRootID,
      toRootID: props.toRootID,

      children: props.children,
      chats: props.chats,
      type: props.type,
    },
    addChats: chats => addChats(chats),
    updateChats: chats => updateChats(chats),
    removeChats: chats => removeChats(chats),
    addNotes: notes => addNotes(notes),
    updateNotes: notes => updateNotes(notes),
    removeNotes: notes => removeNotes(notes),
  }))

  // Chats
  const addChats = toAdd => {
    // Filter duplicated data
    const updatedChats = [...chats, ...toAdd].reduce((r, e) => {
      r[e.id] = e
      return r
    }, {})

    setChats(_.values(updatedChats))
  }
  const updateChats = toUpdate => {
    for (const update of toUpdate) chatRefs[update.id].update(update)
  }
  const removeChats = toRemove => {
    for (const remove of toRemove) {
      chatRefs[remove.id].remove()
    }
  }

  // Notes
  const addNotes = toAdd => {
    if (!_.isEmpty(toAdd)) {
      // Filter duplicated data
      const newArr = [...notes, ...toAdd].reduce((r, e) => {
        r[e.id] = e
        return r
      }, {})

      setNotes(_.values(newArr))
    }
  }
  const updateNotes = toUpdate => {
    for (const update of toUpdate) {
      if (noteRefs[update.id]) noteRefs[update.id].update(update)
    }
  }
  const removeNotes = toRemove => {
    for (const remove of toRemove) {
      noteRefs[remove.id].remove()
    }
  }

  // const renderChats = items =>
  //   items.map(item => (
  //     <BibleChat
  //       ref={c => {
  //         if (c) chatRefs[item.id] = c
  //         return c
  //       }}
  //       onAnimationCompleted={(direction, chatID) => {
  //         if (direction === 'out') setChats(chats.filter(chat => chat.id !== chatID))
  //       }}
  //       key={item.id}
  //       thread={item}
  //     />
  //   ))

  const renderNotes = items =>
    items.map(item => (
      <BibleNote
        ref={(c: any) => {
          if (c) noteRefs[item.id] = c
          return c
        }}
        onAnimationCompleted={(dir, id) => {
          if (dir === 'out') setNotes(notes.filter(note => note.id !== id))
        }}
        key={item.id}
        note={item}
        style={{ height: 20, width: 20, backgroundColor: 'red' }}
      />
    ))

  return (
    <View style={[s.container, props.showQuickNavigation ? { paddingHorizontal: 5 } : { paddingLeft: 20, paddingRight: 5 }]} ref={innerRef}>
      {!!props.showQuickNavigation && (
        <View style={s.chat__list}>
          {renderNotes(notes)}
          {/* {renderChats(chats)} */}
        </View>
      )}

      <Text style={{ flex: 1, lineHeight: 30, textAlign: props.type === 'pr' ? 'right' : 'auto' }}>
        {props.noBreak ? '' : '\n'}
        {props.children}
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  chat__list: {
    width: 60,
    marginTop: 15,
    alignItems: 'center',
  },
  text__container: {
    marginLeft: 0,
  },
})

function areEqual(p, n) {
  return n.fromRootID === p.fromRootID && n.toRootID === p.toRootID
}

export default memo<IProps>(forwardRef(Paragraph), areEqual)
