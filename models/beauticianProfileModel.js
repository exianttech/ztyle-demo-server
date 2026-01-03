const mongoose = require('mongoose')

const beauticianProfileSchema = new mongoose.Schema(
    {

        fullName: {
            type: String,
            required: true
        },
        shopId:{
            type: String,
            required: true
        },
        mobile:{
            type: String,
            required: true
        },
        email:{
            type: String,
            required: true
        },
        gender: {
            type: String,
            required: true,
            enum: ['male', 'female', 'other']
        },
        dob: {
            type: Date,
            required:true
        },
        position: String,
        specialty: String,
        yearsOfExperience: Number,
        employmentStatus: String,
        clientRating: Number,
        performanceMetrics: Number,
        achievements:[{
            type:String
        }],
        availableSlots:{
            type: [{ start: String, end: String }],
            default: []
        },
        holidaySchedule:{
            type: [{ name: String, checked: Boolean }],
            default: []
        },
        profilePic: String,
        languagesSpoken:{
            type: [{ name: String, checked: Boolean }],
        default: []
        },
        notes: String,
        status: {
            type: String,
            required: true,
            enum: ['pending', 'active', 'rejected'],
            default: 'pending'
        },
        profileCompletion: {
            type: Number,
            default: 0 
        },
        advanceProfileStatus: {
            type: Boolean,
            default:false
        }

    },
    {
        timestamps: true        
    }
)

function calculateCompletion(doc) {
    let completion = 0;

    const check = (val) => {
        if (val !== undefined && val !== null && val !== "") {
            completion += 7;
        }
    };

    // Basic fields
    check(doc.fullName);
    check(doc.shopId);
    check(doc.mobile);
    check(doc.email);
    check(doc.gender);
    check(doc.dob);
    check(doc.position);
    check(doc.specialty);

    // yearsOfExperience allows 0
    if (doc.yearsOfExperience !== undefined && doc.yearsOfExperience !== null) {
        completion += 7;
    }
    check(doc.employmentStatus);

    // Arrays
    if (doc.availableSlots?.length > 0) completion += 7;
    if (doc.holidaySchedule?.length > 0) completion += 7;

    // Media + languages
    check(doc.profilePic);
    if (doc.languagesSpoken?.length > 0) completion += 7;

    // Final override
    if (doc.advanceProfileStatus) return 100;

    return completion;

}

// -------------------------------------------
// Pre Hooks for Save + all Update Types
// -------------------------------------------

const hooks = [
    "save",
    "findOneAndUpdate",
    "findByIdAndUpdate",
    "updateOne"
];

hooks.forEach(hook => {
    
    beauticianProfileSchema.pre(hook, async function (next) {
       
        let docData;

        if (this._update) {
            // This is an update operation
            const existingDoc = await this.model.findOne(this.getQuery()).lean();
            if (!existingDoc) return next();

            docData = { ...existingDoc, ...this._update };

        }
        else {
            // This is .save()
            docData = this;
        }

        const completion = calculateCompletion(docData);
        
        // Write back correctly
        if (this._update) {
            this._update.profileCompletion = completion;
        }
        else {
            this.profileCompletion = completion;
        }
        next();
        
    });

});


const beauticianProfileModel = new mongoose.model('beauticianProfile', beauticianProfileSchema)

module.exports = beauticianProfileModel
