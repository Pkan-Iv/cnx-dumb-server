import { nanoid } from 'nanoid'
import chalk from 'chalk'
import util from 'util'
import Winston from 'winston'
const { createLogger, format } = Winston,
      { colorize, combine, printf } = format,
      Formatters = {
        console: ({ date, id, level, message, module, time, args }) => {
          return [
            date,
            time,
            id,
            module,
            level,
            message,
            args
          ].join('  ')
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
          format((info) => {
            if(info.args.length !== 0)  {
                info.args = util.formatWithOptions( {colors: true, depth: 6, sorted: true } ,'%O', ...info.args)
                return info
            }
            return info
          })(),
          format.colorize(),
          format.printf((info) => {
            if ( info.args && Object.keys(info.args).length !== 0 ) {
              if (typeof info.message === 'object') {
                return `${info.date} ${info.time} - ${info.id} - [${chalk.magenta(info.module)}] -   ${info.level}\n \t${util.inspect(info.message, false, 6, true)} ${util.inspect(info.args, false, 6, true)}`
              }
              return `${info.date} ${info.time} - ${info.id} - [${chalk.magenta(info.module)}] -   ${info.level}\n\t${info.message} ${info.args}`
            }
            if (typeof info.message === 'object') {
              return `${info.date} ${info.time} - ${info.id} - [${chalk.magenta(info.module)}] -   ${info.level}\n \t${util.inspect(info.message, false, 6, true)}`
            }
            return `${info.date} ${info.time} - ${info.id} - [${chalk.magenta(info.module)}] -   ${info.level}\n\t${info.message}`
          })
        ),
        level: level || 'debug'
      }),
    )
  }

  const logger = createLogger({
    levels: Winston.config.syslog.levels,
    transports
  })

  return (defines) => {
    return {
      alert(message, ...args) {
        return write('alert', { ...defines, message, args })
      },

      critical(message, ...args) {
        return write('crit', { ...defines, message, args })
      },

      debug(message, ...args ) {
        return write('debug', { ...defines, message, args })
      },

      emergency(message, ...args) {
        return write('emerg', { ...defines, message, args })
      },

      error(message, ...args) {
        return write('error', { ...defines, message, args })
      },

      info(message, ...args) {
        return write('info', { ...defines, message, args })
      },

      init,

      notice(message, ...args) {
        return write('notice', { ...defines, message, args })
      },

      warning(message, ...args) {
        return write('warning', { ...defines, message, args })
      }
    }
  }
}
