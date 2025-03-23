declare module 'vitest' {
  export const describe: (name: string, fn: () => void) => void
  export const it: (name: string, fn: (...args: any[]) => any) => void
  export const beforeEach: (fn: () => void) => void
  export const afterEach: (fn: () => void) => void
  export const expect: any
  export const vi: {
    fn: <T extends (...args: any[]) => any>(implementation?: T) => {
      mockReturnValue: (value: any) => any
      mockResolvedValue: (value: any) => any
      mockRejectedValue: (value: any) => any
      mockImplementation: (fn: (...args: any[]) => any) => any
      mockReturnThis: () => any
      mockClear: () => void
    } & T
    clearAllMocks: () => void
    resetAllMocks: () => void
    resetModules: () => void
    mock: (path: string, factory: () => any) => void
    mocked: <T>(item: T, deep?: boolean) => T
    spyOn: (object: any, method: string) => {
      mockReturnValue: (value: any) => any
      mockResolvedValue: (value: any) => any
      mockRejectedValue: (value: any) => any
      mockImplementation: (fn: (...args: any[]) => any) => any
    }
    stubGlobal: (name: string, value: any) => void
  }
}
