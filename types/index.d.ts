interface ExitHookOptions {
  onExit: Function,
  onExitDone: Function,
  asyncTimeoutMs?: number
}

declare class ExitHook  {
  constructor (options?: ExitHookOptions)
  options: ExitHookOptions
  addHook (cb:Function): void
  unhookEvent (event: string): void
  unhookAllEvent (): void
}

export = ExitHook