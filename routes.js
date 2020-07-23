import { Client } from '@elastic/elasticsearch'
import express from 'express'
import Fetch from 'cross-fetch'
import util from 'util'

import { proxy } from './config/config.json'
import elastic from './services/elastic'
import FetchInterface from './services/fetch'

export function Elastic(logger) {
  const log = logger({ module: ' elastic ' }),
        { ELASTIC_URL } = process.env,
        client = new Client({ node: `${ELASTIC_URL}` }),
        router = express.Router()

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
export function Webhook(logger) {
  const log = logger({ module: ' webhook ' }),
        router = express.Router()
  
  router.post( '/customer_reports', (req, res) => {
    const { body } = req,
    { apikey, ar_result, ar_status, ar_time, called, uuid } = body
    
    if(apikey & ar_result & ar_status & ar_time & called & uuid) {
      console.info('customers report received:\n%o', req.body)
      res.status(200).json()
    } else {
      console.error('One or more inputs missing.')
      return res.status(404).json()
    }
  } )
  
  return router
}
