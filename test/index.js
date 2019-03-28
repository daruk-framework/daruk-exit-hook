const ExitHook = require('../src/index')

const exitHook = new ExitHook({
  onExit (err, cb) {
    if (err) {
      console.log(err.message)
    }
    console.log('exiting')
    setTimeout(() => {
      cb()
    }, 1000)
  },
  onExitDone () {
    console.log('exited')
  }
})

exitHook.addHook(() => {
  console.log('exiting2')
})

// exitHook.unhookAllEvent()

setTimeout(() => {
  throw new Error('uncaughtException exit')
}, 1000)
