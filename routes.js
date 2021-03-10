import express from 'express'
import Fetch from 'cross-fetch'

import elastic from './services/elastic'
import FetchInterface from './services/fetch'

export function Elastic(logger) {
  const router = express.Router()

  router.delete( '/delete_index', elastic.delete_index )

  router.delete( '/delete/:id', elastic.deleteById )

  router.get( '/fetch_data', FetchInterface.fetch_create_index_data )

  router.get( '/find_all', elastic.findAll )

  router.get( '/find', elastic.find )

  router.get( '/find/:id', elastic.findById )
  
  router.post('/create_index', FetchInterface.fetch_create_index_data, elastic.create_index)

  router.post('/create_one', elastic.create_one)

  router.put('/update/:id', elastic.update_one)

  router.put('/update_index', FetchInterface.fetch_update_index_data, elastic.update_index)

  router.post('/version_index', FetchInterface.fetch_version_index_data, elastic.version_index)

  return router
}

export function Test(logger) {
  const log = logger({ module: ' test ' }),
        router = express.Router()

  router.post( '/csv_to_json', FetchInterface.fetch_file_to_upload, FetchInterface.get_json_from_csv_files, elastic.create_index_from_file)

  return router
}

export function TTS(logger) {
  const log = logger({ module: ' tts ' }),
        router = express.Router()

  router.get('/resources/:resource', (req, res, next) => {
    const url= 'https://apiqua.interactivmanager.net/rest/tts/v1',
          { headers, params } = req,
          { apikey } = headers,
          { resource } = params

    return Fetch(`${ url }/${ resource }?apikey=${ apikey }`)
    .then( async (result,) => {
      const { status } = result

      if (status === 404)
        return res.status(404).json({ reason: 'Not Found' })

      const response = await result.json()

      return res.status(status).json( response )
    })
    .catch( (err) => {
      log.error(err)
      res.status(500).json(err)
    })
  })

  router.post('/create/:resource', (req, res, next) => {
    const url= 'https://apiqua.interactivmanager.net/rest/tts/v1',
          { body, headers, params } = req,
          { apikey } = headers,
          { resource } = params

    return Fetch(`${ url }/${ resource }?apikey=${ apikey }`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
    .then( async (result,) => {
      const { status } = result

      // if (status === 404)
      //   return res.status(404).json({ reason: 'Not Found' })

      const response = await result.json()

      return res.status(status).json( response )
    })
    .catch( (err) => {
      log.error(err)
      res.status(500).json(err)
    })
  })

  return router
}

export function Webhook(logger) {
  const log = logger({ module: ' webhook ' }),
        router = express.Router()

  router.post( '/customer_reports', (req, res) => {
    const { body } = req,
    { apikey, ar_result, ar_status, ar_time, called, uuid } = body

    if(apikey && ar_result && ar_status && ar_time && called && uuid) {
      log.info('customers report received:', body)
      log.info('message ', apikey, ar_result, body)
      return res.status(200).json()
    }

    log.error('One or more inputs missing.')
    return res.status(404).json()

  } )

  return router
}
