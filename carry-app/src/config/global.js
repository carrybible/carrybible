global.devLog = (...args) => {
  if (__DEV__) console.log(...args)
}

global.devWarn = (...args) => {
  if (__DEV__) console.warn(...args)
}

global.session = Date.now()
