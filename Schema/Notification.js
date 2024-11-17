const mongoose = require("mongoose");
const { Schema } = mongoose;


const notificationSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ["like"],
        required: true
    },
    blog: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'blogs'
    },
    notification_for: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    }, 
    seen: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
}
)

module.exports = mongoose.model("notification", notificationSchema);