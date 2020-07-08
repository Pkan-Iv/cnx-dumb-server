import { Client } from '@elastic/elasticsearch'
import express from 'express'
import Fetch from 'cross-fetch'

import { proxy } from './config/config.json'

export function Elastic(logger) {
  const log = logger({ module: ' elastic ' }),
        { ELASTIC_URL } = process.env,
        client = new Client({ node: `${ELASTIC_URL}` }),
        router = express.Router()
  
  router.get( '/search_all', (req, res) => {
    const { method, query } = req,
          { index } = query,
          options = {
            headers: { 'content-type': 'application/json' },
            method
          }

    client.search({
      index: index,
      body: {
        query: {
          match_all: {}
        }
      }
    },
    (err, results) => {
      const { body, statusCode } = results,
            { hits } = body
      if (err) {
        log.error(err)
        res.status(statusCode).json({ resaon: err })
      }
    
      const result = hits.hits.map( ({ _source }) => _source)
     log.debug( body)
      return res.status(statusCode).json({ count: hits.total.value, rows: result })
    })
  })
  
  router.post( '/upload', async (req, res) => {
    const { body, method } = req,
          { index } = body,
          options = {
            headers: { 'content-type': 'application/json' },
            method
          },
          url = `${proxy}/${index}`

          console.log('url', url)

    const data = await Fetch(url, { method: 'GET'}).then( (res) => res.json()).then( ({ rows }) => rows).catch( (err) => err)

    console.log('data :>> ', data);





    /* client.search({
      index: index,
      body: {
        query: {
          match_all: {}
        }
      }
    },
    (err, results) => {
      const { body, statusCode } = results,
            { hits } = body
      if (err) {
        log.error(err)
        res.status(statusCode).json({ resaon: err })
      }
    
      const result = hits.hits.map( ({ _source }) => _source)
     log.debug( body)
      return res.status(statusCode).json({ total: hits.total.value, rows: result })
    })*/
  }) 
  
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
