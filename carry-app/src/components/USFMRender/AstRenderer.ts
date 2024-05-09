import { UsfmLexer, UsfmParser } from '@carrybible/usfm-parser'
import BibleFormatter from '@shared/BibleFormatter'
import { formatVerses } from '@shared/Usfm/utils'
import _, { parseInt } from 'lodash'

/**
 *
 */

interface RenderOptions {
  showQuickNav?: boolean
  translation?: any
  inJourney?: boolean
  bookId?: number
  chapterId?: number
}

class AstRenderer {
  _paragraphMarkers: Array<string> = ['br', 'li1', 'nb', 'p', 'pi1', 'pm', 'm', 'mi', 'q1_p', 'q2', 'qm1', 'qm2', 'qr']

  _rules: any
  _styles: any
  _errors: any
  _handlers: any
  _refs: any
  _rows: Array<any>
  _usfmLexer: any
  _usfmParser: any

  /**
   *
   * @param {Object.<string, function>} rules
   * @param {any} style
   */
  constructor(rules: any, style: any, handlers: any) {
    this._rules = rules
    this._styles = style

    this._usfmLexer = new UsfmLexer()
    this._usfmParser = new UsfmParser(this._usfmLexer)

    // Customised
    this._handlers = handlers
    this._errors = {}
    this._rows = []
    this._refs = {}
  }

  getRenderFunction = (type: string) => {
    let renderFunction = this._rules[type]
    if (!renderFunction) {
      this._errors[type] = `Warning: ${type} returned no render function.`
      renderFunction = this._rules.unknown
      // throw new Error(`${type} renderRule not defined example: <USFMBible rules={renderRules}>`)
    }
    return renderFunction
  }

  getHandlerFunction = (type: string) => this._handlers[type]

  /**
   *
   * @param node
   * @param parentNodes
   * @return {*}
   */
  renderNode(node, parentNodes, options: RenderOptions = {}) {
    try {
      const renderFunction = typeof node === 'string' || !node.type ? this.getRenderFunction('text') : this.getRenderFunction(node.type)

      const handlerFunction = this.getHandlerFunction(node.type)

      const parents = [...parentNodes]
      parents.unshift(node)
      let children = []

      if (typeof node === 'string') {
        return renderFunction(node, null, parentNodes, this._styles, handlerFunction, options)
      }

      // Chapter, Paragraphs render
      // { type: 'c', num: [chapterID: number], id: [rootID: number], content: [contentArray: array] }
      if (node.type === 'c' || this._paragraphMarkers.includes(node.type)) {
        // recursive render children nodes
        children = node.content ? node.content.map(value => this.renderNode(value, parents, options)) : []
      }

      // Node that contain value arrays
      const excludedTags = ['f']
      if (!excludedTags.includes(node.type) && node.value && Array.isArray(node.value)) {
        children = node.value.map(value => this.renderNode(value, parents, options))
      }

      if (node[node.type]) {
        children = node[node.type].map(value => this.renderNode(value, parents, options))
      }

      if (this._paragraphMarkers.includes(node.type) && options.inJourney) {
        const para = renderFunction(node, children, parentNodes, this._styles, handlerFunction, this._refs, options)
        this._rows = [...this._rows, para]
      }

      if (node.type === 'c') {
        const chapter = renderFunction(node, children, parentNodes, this._styles, handlerFunction, this._refs, options)
        this._rows = [...this._rows, chapter, ...children]
      }

      if (node.type === 'h') {
        const book = renderFunction(node, children, parentNodes, this._styles, handlerFunction, this._refs, options)
        this._rows = [...this._rows, book]
      }

      if (node.type === 'mt1' || node.type === 'mt2') {
        const book = renderFunction(node, children, parentNodes, this._styles, handlerFunction, this._refs, options)
        this._rows = [...this._rows, book]
      }

      return renderFunction(node, children, parentNodes, this._styles, handlerFunction, this._refs, options)
    } catch (e) {
      console.warn('AstRenderer', e)
    }
  }

  /**
   *
   * @param nodes
   * @return {*}
   */
  private render(
    nodes: Array<any>,
    { showQuickNav = true, translation = undefined, inJourney = false, bookId = 0, chapterId = 0 }: RenderOptions = {},
    appending = false,
  ): any {
    // Reset internal data
    if (!appending) {
      this._refs = {}
      this._rows = []
      this._errors = {}
    }

    if (nodes.length > 0) {
      nodes.forEach(n => this.renderNode(n, [], { showQuickNav, translation, inJourney, chapterId, bookId }))
    }

    // Log all our errors to the terminal :P
    Object.keys(this._errors).forEach(key => console.warn('AstRenderer', this._errors[key]))

    return [this._rows, this._refs]
  }

  renderVerses(verses: Sqlite.Verse[], options?: RenderOptions): any {
    this._refs = {}
    this._rows = []
    this._errors = {}

    let rendered: any[] = [[], []]
    const chapters = _.groupBy(verses, 'chapter')
    Object.keys(chapters).forEach(c => {
      const v = chapters[c]
      const text = v.reduce((mergedText, t) => {
        mergedText += t.usfmText
        return mergedText
      }, `\\c ${c}\n`)

      this._usfmLexer.lexer.source = `\n${text}`
      this._usfmParser.start = 0
      const parsed = this._usfmParser.parse()

      const result = this.render(
        parsed,
        {
          ...options,
          bookId: options?.bookId || v[0].book,
          chapterId: options?.chapterId || v[0].chapter,
        },
        true,
      )
      rendered = result
    })
    return rendered
  }

  renderVersesAdvanced(verses: Sqlite.Verse[], options?: RenderOptions): any {
    this._refs = {}
    this._rows = []
    this._errors = {}

    let rendered: any[] = [[], []]
    const books = _.groupBy(verses, 'book')
    const bookArray = Object.keys(books)
    bookArray.forEach((bookId, bookIndex) => {
      const b = books[bookId]
      const chapters = _.groupBy(b, 'chapter')

      const chapterArray = Object.keys(chapters)

      chapterArray.forEach((chapterId, chapterIndex) => {
        const c = chapters[chapterId]
        let text = c.reduce((mergedText, t, verseIndex) => {
          const checkText = t.usfmText.split('\n')
          // devLog('[RENDER: Check verse]', checkText)
          let shouldAddLineBreak = false
          const newUsfm = checkText.reduce((pre, cur, index) => {
            if (bookIndex == bookArray.length - 1 && chapterIndex == chapterArray.length - 1 && verseIndex == c.length - 1) {
              // Remove title of next verse when it include in the end of previous verse (when this chapter is lastest chapter)
              if (index >= checkText.length - 2) {
                if (cur.includes('\\s1')) return pre
              }
              return pre + '\n' + cur
            } else {
              // devLog('[RENDER: Check current]', cur)
              // In case title in the end of verse but not separate with the next verse
              if (index >= checkText.length - 2 && cur.includes('\\s1')) {
                shouldAddLineBreak = true
              }
              if (index === checkText.length - 1 && shouldAddLineBreak && !cur.includes('\\pi1')) {
                if (!(cur[cur.length - 1] === 'p' && cur[cur.length - 2] === '\\')) {
                  return pre + cur + '\\p'
                }
              }
              // Normal case
              return pre + cur
            }
          }, '')

          const usfm = newUsfm

          if (verseIndex === c.length - 1) {
            const addText = usfm.replace('\\p', '').replace('\\q1', '')
            // devLog('[RENDER: Next add]', addText)
            mergedText += addText
          } else {
            // devLog('[RENDER: Next add]', newUsfm)
            mergedText += newUsfm
          }

          return mergedText
        }, `\\c ${BibleFormatter.getBookName(parseInt(bookId))} ${chapterId} \\p\\b`)
        // Remove \\li1 at the end
        if (text.slice(text.length - 4) === '\\li1') {
          text = text.slice(0, -4).trim()
        }
        // Remove \p at the end
        if (text[text.length - 1] === 'p' && text[text.length - 2] === '\\') {
          text = text.slice(0, -4).trim()
        }
        // Remove \m at the end
        if (text[text.length - 1] === 'm' && text[text.length - 2] === '\\') {
          text = text.slice(0, -2).trim()
        }
        if (text.slice(text.length - 3) === '\\ie') {
          text = text.slice(0, -3).trim()
        }
        if (text.slice(text.length - 3) === '\\wj') {
          // Missing the end, \wj -> \wj*
          text = text + '*'
        }

        // Remove support \f...\f*
        text = text.replaceAll('\\f*', '')
        text = text.replaceAll('\\f ', '')

        this._usfmLexer.lexer.source = `\n${text}`
        this._usfmParser.start = 0

        const parsed = this._usfmParser.parse()
        const result = this.render(
          parsed,
          {
            ...options,
            bookId: parseInt(bookId),
            chapterId: parseInt(chapterId),
          },
          true,
        )
        rendered = result
      })
    })
    return rendered
  }

  renderVersesAutoCorrect(verses: Sqlite.Verse[], options?: RenderOptions): any {
    this._refs = {}
    this._rows = []
    this._errors = {}

    let rendered: any[] = [[], []]
    const books = _.groupBy(verses, 'book')
    const bookArray = Object.keys(books)
    bookArray.forEach((bookId, bookIndex) => {
      const b = books[bookId]
      const chapters = _.groupBy(b, 'chapter')

      const chapterArray = Object.keys(chapters)

      chapterArray.forEach((chapterId, chapterIndex) => {
        const c = chapters[chapterId]
        const text = c.reduce((mergedText, t, verseIndex) => {
          const checkText = t.usfmText.split('\n')
          let shouldAddLineBreak = false
          const newUsfm = checkText.reduce((pre, cur, index) => {
            if (bookIndex == bookArray.length - 1 && chapterIndex == chapterArray.length - 1 && verseIndex == c.length - 1) {
              // Remove title of next verse when it include in the end of previous verse (when this chapter is lastest chapter)
              if (index >= checkText.length - 2) {
                if (cur.includes('\\s1')) return pre
              }
              return pre + '\n' + cur
            } else {
              // devLog('[RENDER: Check current]', cur)
              // In case title in the end of verse but not separate with the next verse
              if (index >= checkText.length - 2 && cur.includes('\\s1')) {
                shouldAddLineBreak = true
              }
              if (index === checkText.length - 1 && shouldAddLineBreak && !cur.includes('\\pi1')) {
                if (!(cur[cur.length - 1] === 'p' && cur[cur.length - 2] === '\\')) {
                  return pre + cur + '\\p'
                }
              }
              // Normal case
              return pre + cur
            }
          }, '')

          mergedText += newUsfm

          return mergedText
        }, `\\c ${BibleFormatter.getBookName(parseInt(bookId))} ${chapterId} \\p\\b`)

        this._usfmLexer.lexer.source = `\n${formatVerses(text)}`
        this._usfmParser.start = 0

        const parsed = this._usfmParser.parse()
        const result = this.render(
          parsed,
          {
            ...options,
            bookId: parseInt(bookId),
            chapterId: parseInt(chapterId),
          },
          true,
        )
        rendered = result
      })
    })
    return rendered
  }
}

export default AstRenderer
