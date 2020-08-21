import express from 'express'

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
