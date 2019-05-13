## daruk-exit-hook

进程退出时执行回调函数，支持执行异步函数

一般在下列情况下，node进程会退出，这些情况都会被daruk-exit-hook捕获：`ctrl+c`、`进程执行完毕`、`pm2 restart|stop`、`uncaughtException`、`unhandledRejection`

注意：使用`pm2 restart|stop`时，pm2的kill_timeout默认是3000ms，就算异步任务没有执行完，超过3000ms进程也会退出，一般可以将这个时间配置长一点：
```javascript
// pm2.config.js
module.exports = {
  apps: [{
    name: 'daruk-app',
    script: './index.js',
    watch: false,
    kill_timeout: 10 * 1000
  }]
}
```

### 使用
```javascript
const ExitHook = require('daruk-exit-hook')

const exitHook = new ExitHook({
  // 就算异步任务没有执行完毕，也必须退出进程的延时
  // 默认是10s
  asyncTimeoutMs: 10 * 1000,
  // 进程退出的回调函数
  // 如果传递了第二个参数callback，callback必须执行
  // 否则会等到asyncTimeoutMs设定的时间再退出
  onExit (err, callback) {
    if (err) {
      daruk.logger.error(err.message)
    }
    daruk.logger.info('process exiting')
    setTimeout(() => {
      daruk.logger.info('process exited')
      callback()
    }, 1000)
  },
  // 执行完退出任务，真正调用process.exit退出进程
  // 注意：这里并不保证所有退出任务都成功执行
  // 参数code是退出码
  onExitDone (code) {
    console.log('process exited')
  }
})
// 也可以编程式地添加退出的回调
exitHook.addHook((err, cb) => {
  setTimeout(() => {
    // do something 1
    cb()
  }, 2000)
})
exitHook.addHook(() => {
  // do something 2
})
```

### 警告

最好不要使用`process.exit()`手动退出进程  

使用`process.exit()`手动退出进程时，退出的回调函数不支持执行异步任务；并且如果退出的回调函数报错，有进程退出失败的风险


## TODO

- 建议研究一下 TS 自动生成 commonjs 的 declaration，现在需要手动的在lib目录中添加 `export = ExitHook`
