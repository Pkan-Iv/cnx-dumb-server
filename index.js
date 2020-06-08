import 'regenerator-runtime'

import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import express from 'express'

import * as Config from './config/config.json'
import router from './routes'

const { host, port } = Config,
      dumb = express()

dumb.use( bodyParser.urlencoded({ extended: true }) )
dumb.use( bodyParser.json() )

dumb.use( compression() )

dumb.use( cors() )


dumb.use( '/', router )

dumb.listen( port, host, () => {
  console.info(`Dumb Server started on http://${host}:${port}.`)
})

