class Emitter {
  static _Listeners: { count: number; refs: { [key: string]: any } } = {
    count: 0,
    refs: {},
  }

  static addEventListener(eventName: string, callback: () => void): string {
    if (typeof eventName === 'string' && typeof callback === 'function') {
      Emitter._Listeners.count += 1
      const eventId = `l${Emitter._Listeners.count}`
      Emitter._Listeners.refs[eventId] = {
        name: eventName,
        callback,
      }
      return eventId
    }
    return ''
  }

  static removeEventListener(id: string) {
    if (typeof id === 'string') {
      return delete Emitter._Listeners.refs[id]
    }
    return false
  }

  static removeAllListeners() {
    let removeError = false
    Object.keys(Emitter._Listeners.refs).forEach(_id => {
      const removed = delete Emitter._Listeners.refs[_id]
      removeError = !removeError ? !removed : removeError
    })
    return !removeError
  }

  static emitEvent(eventName: string, data?: any) {
    Object.keys(Emitter._Listeners.refs).forEach(_id => {
      if (Emitter._Listeners.refs[_id] && eventName === Emitter._Listeners.refs[_id].name) Emitter._Listeners.refs[_id].callback(data)
    })
  }

  /*
   * Shorten
   */
  static on(eventName: string, callback: any): string {
    return Emitter.addEventListener(eventName, callback)
  }

  static rm(eventId: string) {
    return Emitter.removeEventListener(eventId)
  }

  static rmAll() {
    return Emitter.removeAllListeners()
  }

  static emit(eventName: string, data?: any) {
    Emitter.emitEvent(eventName, data)
  }
}

export default Emitter
