const mongoose = require("mongoose");
const { Schema } = mongoose;


// Define a schema for the User collection
const userSchema = mongoose.Schema({
  name: String,
  mobile: String,
  username: {
    type: String,
    //required: true,
    unique: true
  },
  email: {
    type: String,
    //required: true,
    unique: true
  },
  password: String,
  secquestion: String,
  secanswer: String,
  photolink: String,
  account_info:{
    total_posts: {
        type: Number,
        default: 0
    },
    total_reads: {
        type: Number,
        default: 0
    },
},
blogs: {
    type: [ Schema.Types.ObjectId ],
    ref: 'blogs',
    default: [],
}
});
const User= mongoose.model('users', userSchema);
module.exports=User;