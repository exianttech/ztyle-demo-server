const mongoose = require('mongoose')
const Schema = mongoose.Schema

const bookingSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref:'user'
        },
        beauticianId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref:'beauticianProfile'
        },
        shopId: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required:true
        },
        slot: {
            start: String,
            end: String,
        },
        service: String,
        status: {
                type: String,
            enum: ['pending', 'confirmed', 'canceledByUser', 'canceledByBeautician', 'completed'],
            default: 'pending'
        }
    
    },
    {
        timestamps: true
    }
)

const slotModel = new mongoose.model('booking', bookingSchema)
module.exports = slotModel
