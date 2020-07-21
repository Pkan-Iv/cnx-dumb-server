import { Client } from '@elastic/elasticsearch'

import { logger } from '../index'

const { ELASTIC_URL } = process.env,
      client = new Client ({ node: `${ELASTIC_URL}` })

export default {
  /**
   * Return specified index or list of index. If no index is specified,
   * it will return first 1000 indexes.
   * 
   * @param {string} index A comma-separated list of index names to search;
   * use _all or empty string to perform the operation on all indices.
   * 
   * @param {number} hits Number of hits to return ( from 1 to 1000 max.).
   */
  findAll(req, res, {
    hits = 1000,
    log = logger({ module: ' elastic ' })
  } = {}) {

    const { index, size }  = req.query,
          indexes = index.split([',']).map((item) => item.trim()),
          _index  = indexes || '',
          _size = size || hits

    client.search({
      index: _index,
      body: {
        query: {
          match_all: {}
        }
      },
      size: _size
    })
    .then( (data) => {
      const { body, headers, meta, statusCode, warnings } = data,
            { hits } = body,
            { total } = hits,
            rows = hits.hits.map( (index) => index)

      res.status(statusCode).json({ count: total.value, rows  })
    })
    .catch( (err) => {
      log.error(err)
      res.json(err)
    })
  },

  find(req, res, {
    hits = 1000,
    log = logger({ module: ' elastic ' })
  } = {}) {

    const { index, key, size, value }  = req.query,
          indexes = index.split([',']).map((item) => item.trim()),
          _index  = indexes || '',
          _size = size || hits,
          request = { match: { [key] : value } },
          _request = ((key && value)  !== undefined) ? request : { match_all: {}}
          
    client.search({
      index: _index,
      body: {
        query: _request
      },
      size: _size
    })
    .then( (data) => {
      const { body, headers, meta, statusCode, warnings } = data,
            { hits } = body,
            { total } = hits,
            rows = hits.hits.map( (index) => index)

      res.status(statusCode).json({ count: total.value, rows  })
    })
    .catch( (err) => {
      const { meta } = err,
            { body, statusCode } = meta,
            { error } = body,
            context = meta.meta.request.params.body,
            message = [ error.type, error.reason ].join(', ')
      
      
      log.error( message, context)
      res.status(statusCode).json({ message, context })
    })
  } 
}
