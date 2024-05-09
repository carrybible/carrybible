import _ from 'lodash'
import RNFS from '@carrybible/react-native-file-system'
import SQLite, { SQLiteDatabase } from '@carrybible/react-native-sqlite-storage'
import Firestore from './Firestore'
import { RootState } from '@dts/state'
import { TYPES } from '@redux/actions'
import I18n from 'i18n-js'
import Toast from '@components/Toast'

//SQLite.DEBUG(true)
SQLite.enablePromise(true)
const folderPath = `${RNFS.Dir.Document}/translations`

class Database {
  db?: SQLiteDatabase
  opening = false
  file = 'niv.carry'
  // Set when open or when trigger update
  me: RootState['me']
  reading: RootState['reading']
  dispatch: any
  // Utils
  showLoading: (message?: string) => void
  hideLoading: () => void

  renderExample(checkDB): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Load data mostly not return if got error
        devLog('[OPEN DB TIMEOUT]')
        resolve(false)
      }, 1000)

      const query = `SELECT * FROM verse WHERE ( book = 1  AND (chapter >= 1 AND chapter <= 1))  ORDER BY book, chapter, verse`
      checkDB.transaction(tx => {
        devLog('Start ExecuteSQL')
        tx.executeSql(
          query,
          [],
          (__, results) => {
            const { rows } = results
            if (rows && rows.length > 0) {
              clearTimeout(timeout)
              resolve(true)
            } else {
              clearTimeout(timeout)
              resolve(false)
            }
          },
          error => {
            devLog('ExecuteSQL Error', error)
            clearTimeout(timeout)
            resolve(false)
          },
        )
      })
    })
  }

  async reload() {
    await this.close()

    // const db = await SQLite.openDatabase({
    //   name: Platform.OS === 'ios' ? this.file : `${RNFS.Dir.Document}/${this.file}`,
    //   location: 'Documents',
    //   readOnly: true,
    // })

    //@ts-ignore
    // const db = await SQLite.openDatabase({
    //   name: this.file,
    //   // name: Platform.OS === 'ios' ? fileName : `${RNFS.Dir.Document}/${fileName}`,
    //   createFromLocation: this.file,
    //   readOnly: true,
    // })

    const db: SQLiteDatabase = await new Promise(resolve => {
      const timeout = setTimeout(() => {
        // Load data mostly not return if got error
        devLog('[OPEN DB TIMEOUT]')
        resolve(undefined)
      }, 1000)

      SQLite.openDatabase(
        {
          name: this.file,
          createFromLocation: this.file,
          readOnly: true,
        },
        dbSuccess => {
          devLog('[OPEN DB SUCCESS]', dbSuccess)
          clearTimeout(timeout)
          resolve(dbSuccess)
        },
        err => {
          devLog('[OPEN DB FAILURE]', err)
          clearTimeout(timeout)
          resolve(undefined)
        },
      )
    })

    devLog('[RELOAD DB] DATA', db)

    if (db) {
      const success = await this.renderExample(db)
      devLog('[RENDER SAMPLE]', success)
      if (!success) {
        return false
      }

      this.db = db
      this.opening = true
      return true
    } else {
      return false
    }
  }

  async openBible() {
    devLog('[CHECK OPEN BIBLE]', this.db, this.opening)

    if (!this.db || !this.opening) {
      const success = await db.reload()
      devLog('[RELOAD DB] RESULT', success)
      if (success) {
        return true
      } else {
        const downloadTranslations = async (forceDownload = false) => {
          this.showLoading(I18n.t('text.Downloading translation'))
          const isLogin = !!(this.me?.uid && this.me?.streamToken)

          const { document, isMissingTran } = await Firestore.Translation.getAbbr(
            this.me?.translation?.toLowerCase() || this.reading.translation?.abbr?.toLowerCase() || 'niv',
          )

          const existedInLocalDir = await Firestore.Translation.exists(document)
          const isDifferentVersion =
            (isLogin && this.me?.translation?.toLowerCase() !== this.reading.translation?.abbr?.toLowerCase()) ||
            document.version > (this.reading.translation?.version || 0)

          if (forceDownload || !existedInLocalDir || (!isMissingTran && isDifferentVersion)) {
            // Try to download and check translation in local folder
            await Firestore.Translation.download(document, percentage => {
              devLog(`Downloading translation progress: ${percentage}`)
            })
            this.dispatch({ type: TYPES.TRANSLATIONS.VERSION.UPDATE, payload: document })
          }
          this.hideLoading()
          return {
            translationPath: document.carryPath!,
          }
        }

        const { translationPath } = await downloadTranslations(true)
        // await db.open(translationPath)
        this.file = translationPath
        const reCheckSuccess = await db.reload()
        if (reCheckSuccess) {
          return true
        }
      }
      return false
    } else {
      const success = await this.renderExample(this.db)
      return success
    }
  }

  async copyDefaultFile() {
    await RNFS.mkdir(folderPath)
    // const existed = await RNFS.exists(defaultFileDes)

    // if (!existed) {
    //   if (Platform.OS === 'ios') {
    //     await RNFS.copyFile(`${RNFS.Dir.MainBundle}/${this.file}`, defaultFileDes)
    //   }
    // }
  }

  async open(fileName = 'translations/esv.carry') {
    await this.close()
    //@ts-ignore
    const db = await SQLite.openDatabase({
      name: fileName,
      // name: Platform.OS === 'ios' ? fileName : `${RNFS.Dir.Document}/${fileName}`,
      createFromLocation: fileName,
      readOnly: true,
    })
    if (db) {
      this.db = db
      this.opening = true
      this.file = fileName
      return true
    }
    return false
  }

  async close() {
    this.opening = false
    await this.db?.close()
    this.db = undefined
  }

  /**
   * Example
   * filter: {id: 10}
   * @param {*} tableName
   * @param {*} filter
   */
  async list(tableName: string, filter = {}) {
    const success = await this.openBible()
    if (!success) {
      Toast.error(I18n.t('error.passage error'))
      return []
    }

    const sql = _.reduce(
      filter,
      (query, v, k) => {
        if (query.length > 0) return query + `AND "${k}" = ${v}`
        return `WHERE "${k}" = ${v}`
      },
      '',
    )

    const queryBuilder = `SELECT * FROM "${tableName}" ${sql || ''};`
    return new Promise((resolve, reject) => {
      if (this.db && this.opening) {
        this.db.transaction(tx => {
          tx.executeSql(
            queryBuilder,
            [],
            (__, results) => {
              const { rows } = results
              const list: Array<any> = []

              for (let i = 0; i < rows.length; i++) {
                list.push({
                  ...rows.item(i),
                })
              }

              resolve(list)
            },
            error => {
              reject(error)
            },
          )
        })
      } else {
        resolve([])
      }
    })
  }

  async one(tableName: string, filter = {}) {
    const success = await this.openBible()
    if (!success) {
      Toast.error(I18n.t('error.passage error'))
      return {}
    }

    const sql = _.reduce(
      filter,
      (query, v, k) => {
        if (query.length > 0) return query + `AND "${k}" = ${v}`
        return `WHERE "${k}" = ${v}`
      },
      '',
    )
    const queryBuilder = `SELECT * FROM "${tableName}" ${sql || ''};`
    return new Promise((resolve, reject) => {
      if (this.db && this.opening) {
        this.db.transaction(tx => {
          tx.executeSql(
            queryBuilder,
            [],
            (__, results) => {
              const { rows } = results
              resolve(...rows.item(0))
            },
            error => {
              reject(error)
            },
          )
        })
      } else {
        resolve({})
      }
    })
  }

  /**
   * Example
   * filter: {id: 10}
   * @param {*} tableName
   * @param {*} filter
   */
  async query(query: string) {
    const success = await this.openBible()
    if (!success) {
      Toast.error(I18n.t('error.passage error'))
      return []
    }


    return new Promise((resolve, reject) => {
      devLog('CHECK IN', this.db, this.opening)
      if (this.db && this.opening) {
        this.db.transaction(tx => {
          tx.executeSql(
            query,
            [],
            (__, results) => {
              const { rows } = results
              devLog('Result row', rows)
              const list: Array<any> = []

              for (let i = 0; i < rows.length; i++) {
                list.push({
                  ...rows.item(i),
                })
              }

              resolve(list)
            },
            error => {
              Toast.error(I18n.t('error.passage error'))
              devLog('QUERY DATA ERROR', error)
              this.reload().then(() => reject(error))
            },
          )
        })
      } else {
        resolve([])
      }
    })
  }
}

const db = new Database()

export default db
