import express from 'express'

const router = express.Router()

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

export default router
