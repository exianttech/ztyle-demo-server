const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

// enable .env file
require('dotenv').config()

// PORT, database and error middlewares
const PORT = process.env.PORT || 5500
const connectDb = require('./config/db')
const { notFound, errorHandler } = require('./middleware/errorMiddleware')

// routes
const authRoutes = require('./routes/authRoutes')
const userProfileRoutes = require('./routes/userProfileRoutes')
const beauticianProfileRoutes = require('./routes/beauticianProfileRoutes')
const adminRoutes = require('./routes/adminRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const offerRoutes = require('./routes/offerRoutes')
const userRoutes = require('./routes/userRoutes')
const notificationRoutes = require('./routes/notificationRoutes')


// connect to mongodb using mongoose

connectDb()

// middlewares
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/storage/images', express.static('storage/images'))
app.use('/storage/certificates', express.static('storage/certificates'))

// route middlewares
app.use('/api/auth', authRoutes)
app.use('/api/user-profile', userProfileRoutes)
app.use('/api/beautician-profile', beauticianProfileRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/booking',bookingRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/offer', offerRoutes)
app.use('/api/user', userRoutes)
app.use('/api/notification', notificationRoutes)


// the landing page of server
app.get('/', (req, res) => {
    res.status(200).json({ message: "server home page" })
})

app.use(notFound)
app.use(errorHandler)

// starting the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`server is listening at PORT ${PORT}`)
})
