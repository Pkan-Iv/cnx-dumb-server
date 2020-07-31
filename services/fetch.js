import Fetch from 'cross-fetch'
import Path from 'path'
import { logger } from '../index'

import * as Config from '../config/config.json'
import { csvToJSON, toNumber } from '../utils/toolkit'

const { target } = Config

export default {
  async fetch_create_index_data(req, res, next, {
    log = logger({ module: ' fetch ' }),
  } = {}) {
    const { query, body } = req
    if (!query.index) {
      log.warning(`Enter index name.`)
      return res.status(404).json({ reason: `Enter index name.` })
    }
    if (!query.target) {
      log.warning(`Enter target.`)
      return res.status(404).json({ reason: `Enter target.` })
    }

    const { index, target } = query,
          url = `${target}/${index}`
    body.index = index
    body.data = await Fetch(
      url,
      { method: 'GET'}
    )
    .then( async (response) => {
      const data = await response.json(),
            { rows } = data,
            result = rows.flatMap( (doc) => {
              return [{
                create: {
                  _index: index,
                  _id: doc.id,
                }
              },
              { doc: doc
              }]
            })
      log.debug(result)
      return result
    })
    .catch( (err) => {
      const { message } = err
      log.error(message)

      return message
    })
    next()
    return body.data, body.index
  },

  async fetch_file_to_upload (req, res, next, {
    log = logger({ module: ' fetch ' }),
  } = {}) {
    const { files } = req,
          datas = []

    if (!files || Object.keys( files ).length === 0) {
      log.warning({ status: false, reason: 'No files found to upload.' })
      return res.status(204).json()
    }

    const data = Object.keys( files ).forEach( (file) => {
      if ( files[file].length ) {
        return files[file].map( (data) => {
          const { mimetype, mv, name, size } = data
          mv( Path.join( target, name ))
          datas.push({ name, mimetype, size })

          const names = datas.map( ({name}) => name).join(',')   
          log.debug({ status: true, message: "Files '" + names +"' uploaded." })
          return files[file]
        })
      }      

      const { mimetype, mv, name, size } = files[ file ]
      mv( Path.join( target, name ))
      datas.push({ name, mimetype, size })

      log.debug({ status: true, message: "File '" + name +"' uploaded." })

      return files[file]
    })  
    
    // res.json({ status: true, message: "File(s) '" + names +"' uploaded." })
    next()

    return data
  },

  async fetch_update_index_data(req, res, next, {
    log = logger({ module: ' fetch ' }),
  } = {}) {
    const { body, query } = req
    if (!query.index) {
      log.warning(`Enter index name.`)
      return res.status(404).json({ reason: `Enter index name.` })
    }
    if (!query.target) {
      log.warning(`Enter target.`)
      return res.status(404).json({ reason: `Enter target.` })
    }

    const { index, target } = query,
          url = `${target}/${index}`

    body.index = index      
    body.data = await Fetch(
      url,
      { method: 'GET'}
    )
    .then( async (response) => {
      const data = await response.json(),
            { rows } = data,
            result = rows.flatMap( (doc) => {
              return [{
                update: {
                  _index: index,
                  _id: doc.id,
                }
              },
              { doc: doc
              }]
            })
      log.debug(result)

      return result
    })
    .catch( (err) => {
      const { message } = err
      log.error(message)

      return message
    })

    next()
    return body.data, body, index
  },

  async fetch_version_index_data (req, res, next, {
    log = logger({ module: ' fetch ' }),
  } = {}) {
    const { body, query } = req
    if (!query.index) {
      log.warning(`Enter index name.`)
      return res.status(404).json({ reason: `Enter index name.` })
    }
    if (!query.target) {
      log.warning(`Enter target.`)
      return res.status(404).json({ reason: `Enter target.` })
    }

    const { index, target } = query,
          url = `${target}/${index}`

    body.index = index
    body.data = await Fetch(
      url,
      { method: 'GET'}
    )
    .then( async (response) => {
      const data = await response.json(),
            { rows } = data,
            result = rows.flatMap( (doc) => {
              return [{
                index: {
                  _index: index,
                  _id: doc.id,
                }
              },
              { doc: doc
              }]
            })
      log.debug(result)

      //res.status(200).json(result)
      return result
    })
    .catch( (err) => {
      const { message } = err
      log.error(message)

      //res.status(500).json({ message })
      return message
    })

    next()
    return body.data, body.index
  },
  
  async get_json_from_csv_files(req, res, next, {
    log = logger({ module: ' fetch ' }),
  } = {}) {
    const { body, files } = req,
          check = Buffer.isBuffer(files.files.data)

    try {
      if (check) {
  
        const csv = files.files.data.toString()
        
        body.data = csvToJSON(csv, ';')
        body.index = files.files.name
        
        //res.json(csvToJSON(csv, ';'))
        
        
        next()
        log.debug('Change CSV data to JSON. Now transferring to ElasticSearch')
        
        return body
      }
    } catch (error) {
      log.error(error)
      return res.status(500).json({ reason: error})      
    }
  }
}
