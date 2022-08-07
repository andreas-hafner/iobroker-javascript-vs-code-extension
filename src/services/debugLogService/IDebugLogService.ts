
export interface IDebugLogService {
    startCollecting(): Promise<void>
    stopCollecting(): void
    isCollecting(): boolean

    log(message: string, source?: string): void
}
