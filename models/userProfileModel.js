const mongoose = require('mongoose')

const userProfileSchema = new mongoose.Schema(
    
    {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        mobile: {
            type: String,
            required: true
        },
        dob: {
            type: Date,
            required: true
        },
        gender: {
            type: String,
            required: true,
            enum: ['male', 'female', 'other']
        },
        profileCompletion: {
            type: Number,
            default: 0 
        },
        advanceProfileStatus: {
            type: Boolean,
            default: false
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
            completion += 15;
        }
    };

    // Basic fields
    check(doc.fullName);
    check(doc.email);
    check(doc.mobile);
    check(doc.dob);
    check(doc.gender);
    
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
    userProfileSchema.pre(hook, async function (next) {
        
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

    })
})



const userProfileModel = new mongoose.model('userProfile', userProfileSchema)

module.exports = userProfileModel
