const asyncHandler = require('express-async-handler')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')


//models
const userModel = require('../models/userModel')
const adminModel = require('../models/adminModel')
const shopModel = require('../models/shopModel')
const beauticianModel = require('../models/beauticianModel')
const userTokenModel = require('../models/userTokenModel')
const adminTokenModel = require('../models/adminTokenModel')
const beauticianTokenModel = require('../models/beauticianTokenModel')

// utils
const generateToken = require('../utils/generateToken')
const sendEmail = require('../utils/email/sendEmail')

// configs
const clientURL = process.env.CLIENT_URL


const authHome = asyncHandler(async (req, res) => {

    res.status(200).json({ message: 'auth routes: home page' })
})

/// User Section

const registerUser = asyncHandler(async (req, res) => {
    
    const { fullName, email, password } = req.body
    
    // check whether the user already exists in database

    const existingUser = await userModel.findOne({ email })
    
    if (existingUser) {
        res.status(409);
        throw new Error('user already exists');
    }

    // create the new user
    const user = await userModel.create({ fullName, email, password })
    
    if (user) {
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email:user.email
        })

    }
    else {
        res.status(400)
        throw new Error('invalid user')
    }

})

const loginUser = asyncHandler(async (req, res) => {
    
    const { email, password } = req.body
    
    // access the user based on given credentials
    const user = await userModel.findOne({ email })

    // authenticate the user
    if (user && await user.matchPassword(password)) {
        
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: email,
            token: generateToken(user._id, 'user')
        })

        
    }
    else {
        res.status(400)
        throw new Error('Invalid email or password')

    }


})

const requestResetPasswordUser = asyncHandler(async (req, res) => {
    
    const { email } = req.body
    
    // check whether a user exist for email

    const user = await userModel.findOne({ email });
     if (!user) {
        
        res.status(404)
        throw new Error('user does not exist for this email')
    }
    
    // delete existing reset token if any

    let token = await userTokenModel.findOne({ userId: user._id })
    
    if (token) {
        await userTokenModel.deleteOne()
    }
    
    // new reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hash = await bcrypt.hash(resetToken, 10)

    const newToken = {
        userId: user._id,
        token: hash,
        createdAt:Date.now()
    }

    // create new reset token , form the link and send to user email

    await userTokenModel.create(newToken)

    const link = `${clientURL}/page-user-reset-password?token=${resetToken}&id=${user._id}`

    const info = await sendEmail(
        user.email,
        "Password Reset Request",
        {
            email: user.email,
            link:link
        },
        "./template/requestResetPassword.handlebars"
    )

    if (info) {
        res.status(200).json({ message: "success" })
    }
    
})

const resetPasswordUser = asyncHandler(async (req, res) => {
    
    const { userId, token, password } = (req.body);
    
    // access the reset token
    let passwordResetToken = await userTokenModel.findOne({ userId })
     
    if (!passwordResetToken) {
        res.status(404)
        throw new Error('Invalid or Expired Token')
    }

    // validate the token

    const isValid = await bcrypt.compare(token, passwordResetToken.token)
    
    if (!isValid) {
        
        res.status(400)
        throw new Error('Invalid or Expired Token')
    }

    // update the user password

    const hash = await bcrypt.hash(password, 10)
    
    await userModel.findByIdAndUpdate(userId, { password: hash })
    
    const updatedUser = await userModel.findById(userId)
    
    if (updatedUser) {
        res.status(200).json({
            _id: updatedUser._id,
            email:updatedUser.email
        })

        const info = await sendEmail(
            updatedUser.email,
            "Password Reset Successfully",
            {
                email:updatedUser.email
            },
            "./template/resetPassword.handlebars"
        )

        await userTokenModel.deleteOne(passwordResetToken)

        if (info) {
            res.status(200).json({ message: "success" })
        }
    
    }
    else {
        res.status(404)
        throw new Error('Invalid User')

    }
    
})

const deactivateUserAccount = asyncHandler(async (req, res) => {
    
    const { id } = req.params
    
    // delete the current user
    await userModel.findByIdAndDelete(id)

    
    const deletedUser = await userModel.findById(id)

    if (!deletedUser) {
        res.status(200).json(id)
    }
    else {
        res.status(400)
        throw new Error('Delete Failed')
    }

    
})

/// Admin Section

const registerAdmin = asyncHandler(async (req, res) => {
    const { fullName, designation, mobile, email, password } = req.body
    
    // check whether the admin user already exists in database

    const existingAdmin = await adminModel.findOne({ email })
    
    if (existingAdmin) {
        res.status(409);
        throw new Error('admin user already exists');
        
    }
    // create the new admin user
    const admin = await adminModel.create({
        fullName,
        designation,
        mobile,
        email,
        password
    })

    
    if (admin) {
        res.status(200).json({
            _id: admin._id,
            fullName: admin.fullName,
            designation: admin.designation,
            mobile:admin.mobile,
            email: admin.email,
        })

    }
    else {
        res.status(400)
        throw new Error('invalid admin user')
    }


})

const loginAdmin = asyncHandler(async (req, res) => {

    const { email, password } = req.body
    
    // access the admin based on given credentials

    const admin = await adminModel.findOne({ email })

     // authenticate the admin
    if (admin && await admin.matchPassword(password)) {
        
        if (admin.status === 'pending') {
            res.status(401)
            throw new Error('Your activation is pending .. Please wait')
        }
        else if (admin.status === 'rejected') {
            res.status(401)
            throw new Error('Your activation for admin account is rejected')
        }
        else if (admin.status === 'active') {
            res.status(200).json({
                _id: admin._id,
                fullName: admin.fullName,
                designation: admin.designation,
                mobile:admin.mobile,
                email: email,
                status:admin.status,
                token: generateToken(admin._id, 'admin')
        })
            
        }

        
    }
    else {
        res.status(400)
        throw new Error('Invalid email or password')

    }

    
})

const requestResetPasswordAdmin = asyncHandler(async (req, res) => {
    
    const { email } = req.body

    
    // check whether an admin user exist for email

    const admin = await adminModel.findOne({ email });


    if (!admin) {
        
        res.status(404)
        throw new Error('admin user does not exist for this email')
    }
    
    // delete existing reset token if any

    let token = await adminTokenModel.findOne({ userId: admin._id })

    
    if (token) {
        await adminTokenModel.deleteOne()
    }
    
    // new reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hash = await bcrypt.hash(resetToken, 10)

    const newToken = {
        userId: admin._id,
        token: hash,
        createdAt:Date.now()
    }
 

    // create new reset token , form the link and send to admin user email

    await adminTokenModel.create(newToken)

    const link = `${clientURL}/page-admin-reset-password?token=${resetToken}&id=${admin._id}`


    const info = await sendEmail(
        admin.email,
        "Password Reset Request",
        {
            email: admin.email,
            link:link
        },
        "./template/requestResetPassword.handlebars"
    )


    if (info) {
        res.status(200).json({ message: "success" })
    }
    
})
 
const resetPasswordAdmin = asyncHandler(async (req, res) => {
    
    const { userId, token, password } = (req.body);
    
    // access the reset token
    let passwordResetToken = await adminTokenModel.findOne({ userId })
     
    if (!passwordResetToken) {
        res.status(404)
        throw new Error('Invalid or Expired Token')
    }

    // validate the token

    const isValid = await bcrypt.compare(token, passwordResetToken.token)
    
    if (!isValid) {
        
        res.status(400)
        throw new Error('Invalid or Expired Token')
    }

    // update the user password

    const hash = await bcrypt.hash(password, 10)
    
    await adminModel.findByIdAndUpdate(userId, { password: hash })
    
    const updatedAdmin = await adminModel.findById(userId)
    
    if (updatedAdmin) {
        res.status(200).json({
            _id: updatedAdmin._id,
            email:updatedAdmin.email
        })

        const info = await sendEmail(
            updatedAdmin.email,
            "Password Reset Successfully",
            {
                email:updatedAdmin.email
            },
            "./template/resetPassword.handlebars"
        )

        await adminTokenModel.deleteOne(passwordResetToken)

        if (info) {
             res.status(200).json({ message: "success" })
        }
        

    }
    else {
        res.status(404)
        throw new Error('Invalid Admin User')

    }
    
})

const deactivateAdminAccount = asyncHandler(async (req, res) => {
    
    const { id } = req.params

    // delete the current user
    await adminModel.findByIdAndDelete(id)

    
    const deletedAdmin = await adminModel.findById(id)

    if (!deletedAdmin) {
        res.status(200).json(id)
    }
    else {
        res.status(400)
        throw new Error('Delete Failed')
    }

})

/// Beautician Section

const registerBeautician = asyncHandler(async (req, res) => {

    const { fullName, shopId, mobile, email, password } = req.body
    
    // check for the existance of shop based on shop id

    const shop = await shopModel.findOne({ shopId });


    // check whether the beautician user already exists in database

    if (shop) {
        const existingBeautician = await beauticianModel.findOne({ email })
        
        if (existingBeautician) {
            res.status(409);
            throw new Error('beautician user already exists');
            
        }

        // create the new beautician user
        const beautician = await beauticianModel.create({
            fullName,
            shopId,
            mobile,
            email,
            password
        })

    
        if (beautician) {
            res.status(200).json({
                _id: beautician._id,
                fullName: beautician.fullName,
                shopId: beautician.designation,
                mobile: beautician.mobile,
                email: beautician.email
            })
        }
        else {
            res.status(400)
            throw new Error('invalid beautician user')
        }

    }
    else {
        res.status(404)
        throw new Error('Shop Id Does Not Exists')

    }
    

})

const loginBeautician = asyncHandler(async (req, res) => {
    
    const { email, password } = req.body
    
    // access the beautician user based on given credentials
    const beautician = await beauticianModel.findOne({ email })
    
    // authenticate the beautician user
    if (beautician && await beautician.matchPassword(password)) {
        
        res.status(200).json({
            _id: beautician._id,
            fullName: beautician.fullName,
            shopId: beautician.shopId,
            mobile:beautician.mobile,
            email: email,
            token: generateToken(beautician._id, 'beautician')
        })

        
    }
    else {
        res.status(400)
        throw new Error('Invalid email or password')

    }


})

const requestResetPasswordBeautician = asyncHandler(async (req, res) => {
    
    const { email } = req.body

    
    // check whether a beautician user exist for email

    const beautician = await beauticianModel.findOne({ email });


    if (!beautician) {
        
        res.status(404)
        throw new Error('beautician user does not exist for this email')
    }
    
    // delete existing reset token if any

    let token = await beauticianTokenModel.findOne({ userId: beautician._id })

    
    if (token) {
        await beauticianTokenModel.deleteOne()
    }
    
    // new reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hash = await bcrypt.hash(resetToken, 10)

    const newToken = {
        userId: beautician._id,
        token: hash,
        createdAt:Date.now()
    }
 

    // create new reset token , form the link and send to beautician user email

    await beauticianTokenModel.create(newToken)

    const link = `${clientURL}/page-beautician-reset-password?token=${resetToken}&id=${beautician._id}`


   const info = await sendEmail(
        beautician.email,
        "Password Reset Request",
        {
            email: beautician.email,
            link:link
        },
        "./template/requestResetPassword.handlebars"
    )


    if (info) {
        res.status(200).json({ message: "success" })
    }
    
})

const resetPasswordBeautician = asyncHandler(async (req, res) => {
    
    const { userId, token, password } = (req.body);
    
    // access the reset token
    let passwordResetToken = await beauticianTokenModel.findOne({ userId })
     
    if (!passwordResetToken) {
        res.status(404)
        throw new Error('Invalid or Expired Token')
    }

    // validate the token

    const isValid = await bcrypt.compare(token, passwordResetToken.token)
    
    if (!isValid) {
        
        res.status(400)
        throw new Error('Invalid or Expired Token')
    }

    // update the user password

    const hash = await bcrypt.hash(password, 10)
    
    await beauticianModel.findByIdAndUpdate(userId, { password: hash })
    
    const updatedBeautician = await beauticianModel.findById(userId)
    
    if (updatedBeautician) {
        res.status(200).json({
            _id: updatedBeautician._id,
            email:updatedBeautician.email
        })

        const info = await sendEmail(
            updatedBeautician.email,
            "Password Reset Successfully",
            {
                email:updatedBeautician.email
            },
            "./template/resetPassword.handlebars"
        )

        await beauticianTokenModel.deleteOne(passwordResetToken)

        if (info) {
            res.status(200).json({ message: "success" })
        }


    }
    else {
        res.status(404)
        throw new Error('Invalid Beautician User')

    }
    
})

const deactivateBeauticianAccount = asyncHandler (async(req,res) => {

    const { id } = req.params

    // delete the current user
    await beauticianModel.findByIdAndDelete(id)

    
    const deletedBeautician = await beauticianModel.findById(id)

    if (!deletedBeautician) {
        res.status(200).json(id)
    }
    else {
        res.status(400)
        throw new Error('Delete Failed')
    }

    
})

const getShopIds = asyncHandler(async (req, res) => {
    
    const shops = await shopModel.find();
    const shopIds = shops.map(shop => {
        return shop.shopId
    })

    if (shopIds.length !== 0) {
        res.status(200).json(shopIds)
    }
    else {
        res.status(404)
        throw new Error('No Active Shops Found')
    }

})


module.exports = {
    authHome,
    registerUser,
    loginUser,
    deactivateUserAccount,
    requestResetPasswordUser,
    resetPasswordUser,
    registerAdmin,
    loginAdmin,
    requestResetPasswordAdmin,
    resetPasswordAdmin,
    deactivateAdminAccount,
    registerBeautician,
    loginBeautician,
    requestResetPasswordBeautician,
    resetPasswordBeautician,
    deactivateBeauticianAccount,
    getShopIds

}
