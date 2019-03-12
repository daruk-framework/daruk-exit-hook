interface ExitHookOptions {
  onExit: Function,
  onExitDone: Function,
  asyncTimeoutMs?: number
}

declare class ExitHook  {
  constructor (options?: ExitHookOptions)
  options: ExitHookOptions
  unhookEvent(event: 'string'): void
  addHook (cb:Function): void
}

export = ExitHook