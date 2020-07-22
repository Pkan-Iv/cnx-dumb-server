import Fetch from 'cross-fetch'
import { logger } from '../index'

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
  }
}
