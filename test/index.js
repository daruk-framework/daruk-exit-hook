const ExitHook = require('../lib/index');

const exitHook = new ExitHook({
  onExit (err, cb) {
    console.log(err);
    if (err) {
      console.log(err.message)
    }
    console.log(' onExit exiting')
    setTimeout(() => {
      cb()
    }, 1000)
  },
  onExitDone (code) {
    console.log(`onExitDone exited ${code}`)
  }
});

// console.log(exitHook)

exitHook.addHook(() => {
  console.log('addHook exiting2')
})

// exitHook.unhookAllEvent()

setTimeout(() => {
  throw new Error('uncaughtException exit')
}, 1000)
