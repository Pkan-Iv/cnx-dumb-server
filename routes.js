import express from 'express'

const router = express.Router()

router.post( '/customer_reports', (req, res) => {
  console.info('customers report received:\n%o', req.body)
  res.status(200).json()
} )

export default router
