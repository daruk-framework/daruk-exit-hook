// fork from https://github.com/Tapppi/async-exit-hook

const hooks = []
const uncaughtExceptionHooks = []
const unhandledRejectionHooks = []
let called = false
let waitingFor = 0
let asyncTimeoutMs = 10000
const noop = function () {}
let exitDoneFunc = noop

const events = {}
const filters = {}

function exit (exit, type, code, err) {
  // Helper functions
  let doExitDone = false

  function doExit () {
    if (doExitDone) {
      return
    }
    doExitDone = true

    if (exit === true) {
      // All handlers should be called even if the exit-hook handler was registered first
      // process.nextTick(process.exit.bind(null, code))
      process.nextTick(() => {
        // 真正退出
        exitDoneFunc(code)
        process.exit.call(null, code)
      })
    }
  }

  // Async hook callback, decrements waiting counter
  function stepTowardExit () {
    process.nextTick(() => {
      if (--waitingFor === 0) {
        doExit()
      }
    })
  }

  // Runs a single hook
  function runHook (syncArgCount, err, hook) {
    // Cannot perform async hooks in `exit` event
    if (exit && hook.length > syncArgCount) {
      // Hook is async, expects a finish callback
      waitingFor++

      // if (err) {
      //   // Pass error, calling uncaught exception handlers
      //   return hook(err, stepTowardExit)
      // }
      // return hook(stepTowardExit)
      // 保证无论是否有错误，第一个参数都是err（无错误时，err === null）
      return hook(err, stepTowardExit)
    }

    // Hook is synchronous
    if (err) {
      // Pass error, calling uncaught exception handlers
      // 保证外部调用callback时，callback存在
      return hook(err, noop)
    }
    // 保证外部调用callback时，callback存在
    return hook(null, noop)
  }

  // Only execute hooks once
  if (called) {
    return
  }

  called = true

  // Run hooks
  if (err) {
    if (type === 'uncaughtException') {
      // Uncaught exception, run error hooks
      uncaughtExceptionHooks.map(runHook.bind(null, 1, err))
    } else if (type === 'unhandledRejection') {
      unhandledRejectionHooks.map(runHook.bind(null, 1, err))
    }
  } else {
    // hooks.map(runHook.bind(null, 0, null))
    // 不管哪种情况的退出，第一个参数都是null，第二个参数是callback
    // 也就是形参个数大于1才认为传递了callback，需要等待callback被执行
    hooks.map(runHook.bind(null, 1, null))
  }

  if (waitingFor) {
    // Force exit after x ms (10000 by default), even if async hooks in progress
    setTimeout(() => {
      doExit()
    }, asyncTimeoutMs)
  } else {
    // No asynchronous hooks, exit immediately
    doExit()
  }
}

// Add a hook
function add (hook) {
  hooks.push(hook)

  if (hooks.length === 1) {
    add.hookEvent('exit')
    add.hookEvent('beforeExit', 0)
    add.hookEvent('SIGHUP', 128 + 1)
    // SIGINT代表 ctr+c 退出，标准 exit code 是130
    // 但使用npm script启动服务时，如果exit code不是0，会报错
    add.hookEvent('SIGINT', 0)
    // add.hookEvent('SIGINT', 128 + 2);
    add.hookEvent('SIGTERM', 128 + 15)
    add.hookEvent('SIGBREAK', 128 + 21)

    // PM2 Cluster shutdown message. Caught to support async handlers with pm2, needed because
    // explicitly calling process.exit() doesn't trigger the beforeExit event, and the exit
    // event cannot support async handlers, since the event loop is never called after it.
    add.hookEvent('message', 0, function (msg) { // eslint-disable-line prefer-arrow-callback
      if (msg !== 'shutdown') {
        return true
      }
    })
  }
}

// New signal / event to hook
add.hookEvent = function (event, code, filter) {
  events[event] = function () {
    const eventFilters = filters[event]
    for (let i = 0; i < eventFilters.length; i++) {
      if (eventFilters[i].apply(this, arguments)) {
        return
      }
    }
    exit(code !== undefined && code !== null, undefined, code)
  }

  if (!filters[event]) {
    filters[event] = []
  }

  if (filter) {
    filters[event].push(filter)
  }
  // @ts-ignore
  process.on(event, events[event])
}

// Unhook signal / event
add.unhookEvent = function (event) {
  process.removeListener(event, events[event])
  delete events[event]
  delete filters[event]
}

// List hooked events
add.hookedEvents = function () {
  const ret = []
  for (const name in events) {
    if ({}.hasOwnProperty.call(events, name)) {
      ret.push(name)
    }
  }
  return ret
}

// Add an uncaught exception handler
add.uncaughtExceptionHandler = function (hook) {
  uncaughtExceptionHooks.push(hook)

  if (uncaughtExceptionHooks.length === 1) {
    process.once('uncaughtException', exit.bind(null, true, 'uncaughtException', 1))
  }
}

// Add an unhandled rejection handler
add.unhandledRejectionHandler = function (hook) {
  unhandledRejectionHooks.push(hook)

  if (unhandledRejectionHooks.length === 1) {
    process.once('unhandledRejection', exit.bind(null, true, 'unhandledRejection', 1))
  }
}

// Configure async force exit timeout
add.forceExitTimeout = function (ms) {
  asyncTimeoutMs = ms
}

// 所有异步回调执行完毕后再调用的回调
// 在这里不能再执行异步函数
// 只是表明进程退出成功
add.exitDone = function (func) {
  exitDoneFunc = func
}

// Export
module.exports = add
