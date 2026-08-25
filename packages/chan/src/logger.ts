import signale from 'signale'
import type { VFile } from 'vfile'
import type { VFileMessage } from 'vfile-message'

interface ReportOptions {
  logger: signale.Signale
  file: VFile | Error | null | undefined
  verbose?: boolean
}

function report({ logger, file, verbose }: ReportOptions): void {
  if (!file) {
    return
  }

  if (file instanceof Error) {
    if ('reason' in file) {
      ;(file as Error).name = 'Error'
    }

    if (verbose) {
      logger.error(file)
    } else {
      logger.error(file.message)
    }
    return
  }

  file.messages.forEach((m: VFileMessage) => {
    if (m.fatal) {
      m.name = 'Error'
      if (verbose) {
        logger.fatal(m)
      } else {
        logger.fatal(m.message)
      }
    } else {
      logger[m.fatal === false ? 'warn' : 'info']({ message: m.message })
    }
  })
}

export function hasWarnings(file: VFile | null | undefined): boolean {
  if (!file) {
    return false
  }
  return !!file.messages.find(m => m.fatal === false)
}

interface LoggerOptions {
  scope?: string
  verbose?: boolean
  stdout?: boolean
}

export interface ChanLogger extends signale.Signale {
  report: (file: VFile | Error | null | undefined) => void
}

export function createLogger({ scope, verbose, stdout }: LoggerOptions): ChanLogger {
  const logger = new signale.Signale({
    stream: stdout ? process.stderr : process.stdout,
    scope: ['chan', scope].filter(Boolean) as unknown as string
  }) as ChanLogger

  const prevError = logger.error.bind(logger)
  logger.error = (...args: Parameters<typeof prevError>) => {
    process.exitCode = 1
    prevError(...args)
  }

  const prevFatal = logger.fatal.bind(logger)
  logger.fatal = (...args: Parameters<typeof prevFatal>) => {
    process.exitCode = 1
    prevFatal(...args)
  }

  logger.report = (file: VFile | Error | null | undefined) => report({ logger, file, verbose })
  return logger
}
