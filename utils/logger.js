import { nanoid } from 'nanoid'
import chalk from 'chalk'
import util from 'util'
import Winston from 'winston'

const { createLogger, format } = Winston,
      { colorize, combine, printf } = format,
      Formatters = {
        console: ({ date, id, level, message, module, time }) => {
          return [
            date,
            time,
            id,
            module,
            level,
            message
          ].join('  ')
        },
        custom: ({ date, id, level, message, module, time }) => {
          return `${date} ${time} ${id} - [${chalk.magenta(module)}] -   ${level}   - ${message}`
        }
      }

export function Now() {
  const [date, time] = (new Date()).toISOString().split('T')
  return { date, time }
}

export default function CreateLogger({ level, path }) {
  let id
  function init(value = nanoid()) {
    if (id === undefined)
      return value
    return id = value
  }
  id = init()

  function write(type, meta) {
    return logger[type]({ ...meta, id, ...Now() })
  }
  const transports = []

  if (process.env.NODE_APP_INSTANCE !== undefined) {
    transports.push(
      new Winston.transports.File({
        filename: `${path}/error.log`,
        format: combine(
          printf(Formatters.console),
        ),
        level: 'error'
      }),

      new Winston.transports.File({
        filename: `${path}/combined.log`,
        format: combine(
          printf(Formatters.console),
        ),
        level: level || 'info'
      }),

      new Winston.transports.MongoDB({
        database: 'server_test',
        filename: `${path}/database.log`,
        format: combine(
          colorize(),
          printf(Formatters.console),
        ),
        level: level || 'silly'
      })
    )
  } else {
    transports.push(
      new Winston.transports.Console({
        format: combine(
          format((info) => {
            info.level = info.level.toLocaleUpperCase()
            return info
          })(),
          format((info) => {
            info.module = info.module.toLocaleUpperCase()
            return info
          })(),
          format((info) => {
            if (typeof info.message === 'object') {
              if (Array.isArray(info.message)) {
                info.message = info.message[0]
              }
            }
            return info
          })(),
          format.colorize(),
          format.printf((info) => {
            if (typeof info.message === 'object') {
              const { message } = info
              return `${info.date} ${info.time} ${info.id} - [${chalk.magenta(info.module)}] -   ${info.level}\n` + util.inspect(message, false, 6, true)
            }
            return `${info.date} ${info.time} ${info.id} - [${chalk.magenta(info.module)}] -   ${info.level}\n\t${info.message}`
          }
          ),
        ),
        level: level || 'debug'
      }),
    )
  }

  const logger = createLogger({
    levels: Winston.config.syslog.levels,
    transports,
  })

  return (defines) => {
    return {
      alert(message) {
        return write('alert', { ...defines, message })
      },

      critical(message) {
        return write('crit', { ...defines, message })
      },

      debug(message, ...args) {
        return write('debug', { ...defines, message, args })
      },

      emergency(message) {
        return write('emerg', { ...defines, message })
      },

      error(message) {
        return write('error', { ...defines, message })
      },

      info(message) {
        return write('info', { ...defines, message })
      },

      init,

      notice(message) {
        return write('notice', { ...defines, message })
      },

      warning(message) {
        return write('warning', { ...defines, message })
      }
    }
  }
}
