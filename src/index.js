const exitHook = require('./async-exit-hook')

const defaultOptions = {
  onExit () {},
  onExitDone () {},
  asyncTimeoutMs: 1000 * 10
}

class ExitHook {
  constructor (options = {}) {
    this.options = Object.assign(defaultOptions, options)
    exitHook.forceExitTimeout(this.options.asyncTimeoutMs)

    this.unhookEvent = exitHook.unhookEvent
    exitHook.exitDone(this.options.onExitDone)
    this.addHook(this.options.onExit)
  }
  addHook (exitFunc) {
    exitHook(exitFunc)
    exitHook.unhandledRejectionHandler(exitFunc)
    exitHook.uncaughtExceptionHandler(exitFunc)
  }
}

module.exports = ExitHook
