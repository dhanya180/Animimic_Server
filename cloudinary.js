
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: process.env.cloud_name,
    api_key: process.env.cloud_apikey, 
    api_secret: process.env.api_secret,
    secure:true
});

module.exports=cloudinary;


// server.post('/get-profile',(req,res)=>{
//     let {username}=req.body;

//     User.findOne({ "username ":username})
//     .select("-ppassword -secquestion -secanswer -blogs")
//     .then(user=>{
//         return res.status(200).json(user)
//     })
//     .catch(err=>{
//         console.log(err);
//         return res.status(500).json({error:err.message})
//     })
// })