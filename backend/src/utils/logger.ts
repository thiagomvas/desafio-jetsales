export type LogLevel = 'INFO' | 'WARN' | 'ERROR'

function getTimestamp() {
  return new Date().toISOString()
}

function colorForLevel(level: LogLevel) {
  switch (level) {
    case 'INFO': return '\x1b[34m'    // Green
    case 'WARN': return '\x1b[33m'    // Yellow
    case 'ERROR': return '\x1b[31m'   // Red
  }
}

function resetColor() {
  return '\x1b[0m'
}

function formatMessage(level: LogLevel, category: string, message: string) {
  const color = colorForLevel(level)
  const timestamp = getTimestamp()

  // Only bracketed parts are colored
  return `[${color}${timestamp}${resetColor()}] [${color}${level}${resetColor()}] [${color}${category}${resetColor()}] ${message}`
}

export const logger = {
  info: (category: string, message: string) => {
    console.log(formatMessage('INFO', category, message))
  },
  warn: (category: string, message: string) => {
    console.warn(formatMessage('WARN', category, message))
  },
  error: (category: string, message: string, error?: Error) => {
    console.error(formatMessage('ERROR', category, message))
    if (error) {
      console.error(error.stack)
    }
  },
}
