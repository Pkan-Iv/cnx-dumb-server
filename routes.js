import { Client } from '@elastic/elasticsearch'
import express from 'express'
import Fetch from 'cross-fetch'
import util from 'util'

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

    if (!index) {
      log.warning(`Enter index name.`)
      return res.status(400).json({ reason: `Enter index name.` })
    }

    client.search({
      index: index,
      body: {
        query: {
          match_all: {}
        }
      }
    },
    async (err, results) => {
      const { body, statusCode } = results,
            { hits } = body
      if (err) {
        const { error, status } = err.meta.body
        log.error([error.type, error.reason].join(', '))
        return res.status(status).json({ reason: [error.type, error.reason].join(', ') })
      }
    
      const result = hits.hits.map( ({ _id, _source }) => ({_id,..._source}))
      
      return res.status(statusCode).json({ count: hits.total.value, rows: result })
    })
  })
  
  router.post( '/index', async (req, res) => {
    const { index } = req.body

    if (!index) {
      log.warning(`Enter index name.`)
      return res.status(400).json({ reason: `Enter index name.` })
    }

    const url = `${proxy}/${index}`,
          _index = index.replace('/','_')

    const data = await Fetch(
      url,
      { method: 'GET'}
      )
      .then( (res) => res.json())
      .then( ({ rows }) => rows)
      .catch( (err) => log.error(err))

    const body = data.flatMap( (doc) => [{ index: {
      _index: _index,
      _id: doc.id
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

    res.status(201).json({ count: count.count, rows: data/* { _id: data.id ,...data } */ })
  })  
  
  router.put( '/index', async (req, res) => {
    const { index } = req.body

    if (!index) {
      log.warning(`Enter index name.`)
      return res.status(400).json({ reason: `Enter index name.` })
    }

    const url = `${proxy}/${index}`,
          _index = index.replace('/','_')

    const data = await Fetch(
      url,
      { method: 'GET'}
    )
    .then( (res) => res.json())
    .then( ({ rows }) => rows.flatMap( (doc) => {
      return [{
        update: {
          _index: _index,
          _id: doc.id,
        }
      },
      { doc: doc
      }]
    }))
    .catch( (err) => log.error(err))
    
    client.bulk({ body: data, index: _index, refresh: true })
    .then( async (bulkResponse) => {
      const { statusCode,  meta } = bulkResponse,
            result = bulkResponse.body.items.filter( ({ update }) => {
              if (update.result === 'updated'){
                return update
              }
            }).map( (item) => ({...item.update}))

      log.debug( result )
      res.status(statusCode).json( result )
    })
    .catch( (err) => {
      const { error, status } = err.meta.body
      log.error([ error.type, error.reason ].join(', '))
      return res.status(status).json({ reason: [error.type, error.reason].join(', ') })
    })
  })  
  
  router.delete( '/index', (req, res) => {
    const { index } = req.body
    
    if(!index) {
      log.warning(`Enter index name.`)
      return res.status(404).json({ reason: `Enter index name.` })
    }

    client.indices.delete({ index })
    .then( (result) => {
      const { body, statusCode } = result
      log.debug(body)
      return res.status(statusCode).json(body)
    })
    .catch( (err) => {
      const { error, status } = err.meta.body
      log.error([error.type, error.reason].join(', '))
      return res.status(status).json({ reason: [error.type, error.reason].join(', ') })
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
