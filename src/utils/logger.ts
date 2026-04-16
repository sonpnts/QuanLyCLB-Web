/**
 * Frontend logger — writes errors to a daily log file via the /api/log route.
 *
 * Usage:
 *   import { logger } from '@/utils/logger'
 *   ...
 *   } catch (error: any) {
 *     logger.error('MyClassName', 'myMethod', error)
 *     ...
 *   }
 */

interface LogPayload {
  level: string
  className: string
  method: string
  message: string
  stack?: string
}

async function postLog(payload: LogPayload): Promise<void> {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // fire-and-forget — don't await in callers
      keepalive: true
    })
  } catch {
    // Silently fail — logging must never crash the app
  }
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error

  return String(error)
}

function extractStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack

  return undefined
}

export const logger = {
  /**
   * Log an error (exception or plain message).
   * @param className  Name of the class / file where the error occurred
   * @param method     Name of the method / function where the error occurred
   * @param error      The caught exception, or a plain message string
   */
  error(className: string, method: string, error: unknown): void {
    void postLog({
      level: 'ERROR',
      className,
      method,
      message: extractMessage(error),
      stack: extractStack(error)
    })
  },

  warn(className: string, method: string, message: string): void {
    void postLog({ level: 'WARN', className, method, message })
  },

  info(className: string, method: string, message: string): void {
    void postLog({ level: 'INFO', className, method, message })
  }
}
