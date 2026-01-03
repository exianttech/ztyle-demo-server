const asyncHandler = require('express-async-handler')

// models
const notificationModel = require('../models/notificationModel')


// utils
const removeOldNots = require('../utils/removeOldNots')

const notificationHome = asyncHandler(async (req, res) => {
    res.json({ message: "notification : home page" })
})

const addNotification = asyncHandler(async (req, res) => {
    const { senderName, senderId, receiverId, message, notificationType } = req.body
    
    // back end validation
    if (!senderName || !senderId || !receiverId || !message) {
        res.status(404)
        throw new Error('At least one field is empty')
    }
    
    // add new notification to db 
    const notification = await notificationModel.create({ senderName, senderId, receiverId, message, notificationType })
    if (notification) {
        res.status(200).json(notification)
    }
    else {
        res.status(400)
        throw new Error('Invalid Notification')
    }
    
})

const getNotifications = asyncHandler(async (req, res) => {
    const { id } = req.params
    
    // remove old notificatins
    removeOldNots(id)
    
    // get active notifications
    const notifications = await notificationModel.find({ receiverId: id }).sort({ createdAt: 'desc' })
    
    // update the read status of notification

    let readStatus = "read"
    let i
    for (i = 0; i < notifications.length; i++){
        if (!notifications[i].status) {
            readStatus = "unread"
        }

    }

    if (notifications.length !== 0) {
        res.status(200).json({
            receiverId:id,
            notifications,
            readStatus
        })

    }
    else {
        res.status(404).json({ message: "No New Notifications" })
    }

})

const readNotification = asyncHandler(async (req, res) => {
    const { id } = req.params
    
    // get all notifications for receiver id 
    const notifications = await notificationModel.find({ receiverId: id })
    
    // set read status true for current notifications
    let i
    for (i = 0; i < notifications.length; i++){
        await notificationModel.findByIdAndUpdate(
            notifications[i]._id,
            { status: true }
        )
    }
    
    const updatedNotifications = await notificationModel.find({ receiverId: id }).sort({ createdAt: 'desc' })

    if (updatedNotifications.length !== 0) {
        res.status(200).json({
            receiverId: id,
            notifications: updatedNotifications,
            readStatus:"read"
        })
        
    }
    else {
        res.status(404).json({ message: "No Notifications Found" })
    }
})

module.exports = {
    notificationHome,
    addNotification,
    getNotifications,
    readNotification
}
