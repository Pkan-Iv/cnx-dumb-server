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
    const { method } = req,
          { index } = req.body,
          options = {
            headers: { 'content-type': 'application/json' },
            method
          },
          url = `${proxy}/${index}`,
          _index = index.replace('/','_')

    const data = await Fetch(
      url,
      { method: 'GET'}
      )
      .then( (res) => res.json())
      .then( ({ rows }) => rows).catch( (err) => err)

    const body = data.flatMap( (doc) => [{ index: {
      _index: _index
    }},
    doc] )

    const { body: bulkResponse } = await client.bulk({ refresh: true, body })

    if(bulkResponse.errors) {
      const errorDoc= []

      bulkResponse.items.forEach( (action, i) => {
        const operation = Object.keys(action)[0]

        if (action[operation].error) {
          errorDoc.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1]
          })
        }
      })
      log.error(errorDoc)
      res.status(errorDoc.status).json({ reason: errorDoc.error.reason })
    }

    const { body: count } = await client.count({ index: _index })

    log.info(count)
    res.status(201).json({ count, rows: data })
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
