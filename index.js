import 'dotenv/config.js'
import 'regenerator-runtime'

import chalk from 'chalk'
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import FileUpload from 'express-fileupload'
import helmet from 'helmet'

import CreateLogger from './utils/logger.js'

import * as Config from './config/config.json'
import { Elastic, Webhook, Test } from './routes'

const { host, logs, port } = Config,
      { HOST, PORT } = process.env,
      Port = PORT || port,
      Host = HOST || host,
      dumb = express()
      
export const logger = CreateLogger(logs)
const log = logger({ module: ' dumb ' })

dumb.use( helmet() )

dumb.use( express.urlencoded({ extended: true }) )
dumb.use( express.json() )

dumb.use( compression() )

dumb.use( cors() )
dumb.use( FileUpload() )

dumb.use( (req, res, next) => {
  const { body, method, path, query } = req

  log.notice( `${method}  ${path}` )
  log.debug( body )
  log.debug( query )

  res.set({ 'Content-Type': 'application/json' })
  return next()
})


dumb.use( '/elastic', Elastic(logger) )
dumb.use( '/test', Test(logger) )
dumb.use( '/', Webhook(logger) )

dumb.listen( port, host, () => {
  log.info(`${chalk.green("✓")} Dumb Server started on http://${Host}:${Port}.`)
})

