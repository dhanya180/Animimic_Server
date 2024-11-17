const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
//cross origin alliance
const cors = require('cors');
//const { nanoid }=require('nanoid');
const jwt = require('jsonwebtoken');
//const multer = require('multer');
const cloudinary=require("./cloudinary")

let nanoid;
(async () => {
    nanoid = (await import('nanoid')).nanoid;
})();
//const Forum=require('./Schema/forum');
const Blog = require('./Schema/Blog');
const User=require('./Schema/users');
const Notification=require('./Schema/Notification');
const server = express();
const PORT = 5000
//limiting the size to 50megabytes
server.use(express.urlencoded({ extended: true ,limit:'50mb' })); 
server.use(express.json({limit:'50mb'}));
server.use(cors());


//console.log(process.env.cloudinary_upload_preset);
//console.log( process.env.cloud_name);
const generateUploadURL = async () => {
    const imageName = `${nanoid()}-${Date.now()}.jpeg`;
    const uploadPreset = process.env.cloudinary_upload_preset;
    const timestamp = Math.round(Date.now() / 1000);

    if (!uploadPreset) {
        throw new Error('Upload preset is not defined');
    }

    
    // Generate the signature
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, public_id: imageName, upload_preset: process.env.cloudinary_upload_preset },
        process.env.cloud_apisecret
    );

    // Construct the upload URL with all the necessary parameters
    const uploadURL = new URL(`https://api.cloudinary.com/v1_1/${process.env.cloud_name}/image/upload`);
    uploadURL.search = new URLSearchParams({
        upload_preset: uploadPreset,
        public_id: imageName,
        timestamp,
        signature,
        api_key: process.env.cloud_apikey,
    }).toString();

    return uploadURL.toString();
};

//module.exports = { generateUploadURL };


//module.exports = { generateUploadURL };

//upload image url route
server.get('/get-upload-url', async (req, res) => {
    // try {
    //     const uploadURL = await generateUploadURL(); 
    //     res.json({ uploadURL });
    // } catch (error) {
    //     res.status(500).json({ error: error.message });
    // }
    generateUploadURL()
    .then(url=>res.status(200).json({uploadURL:url}))
    .catch(err=>{
        console.log(err.message);
        return res.status(500).json({error:err.message})
    })
});
const verifyJWT=(req,res,next)=>{ 
    const authHeader=req.headers['authorization'];
    const token=authHeader && authHeader.split(" ")[1];
    if(!token){
        return res.status(401).json({error:"no access token or JWT"})
    }
    jwt.verify(token, process.env.secret_access_key,(err,user)=>{
        if(err){
            return res.status(403).json({error:"Access token is invalid"})
        }

        req.user=user._id;
        next();
    });
};

// MongoDB connection
console.log("Connecting to MongoDB...");
mongoose.connect(process.env.DB_Location, {
    autoIndex: true 
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

//retreiving based on the time at which blog created.


server.post('/latest-blogs',(req,res)=>{
    let maxLimit=5;
    Blog.find({draft:false}).
    populate("author", "username name -_id")
    .sort({"publishedAt":-1})
    .select("blog_id title des banner activity tags publishedAt -_id")
    .limit(maxLimit)
    .then(blogs=>{
        console.log(blogs);
        return res.status(200).json({blogs:blogs})  
    })
    .catch(err=>{

        console.log(err);
        return res.status(500).json({error:err.message})
    })
})

//reteiving based on the no of reads and likes
server.get('/trending-blogs',(req,res)=>{
    let {page}=req.body;
    let maxLimit2=5;
    Blog.find({draft:false}).populate("author","username name photolink- -_id")
    .sort({"activity.total_read":-1,"activity.total_likes":-1})
    .select("blog_id title publishedAt -_id")
    .skip((page-1)*maxLimit2)
    .limit(5)
    .then(blogs=>{
        return res.status(200).json({blogs})
    })
    .catch(err=>{
        return res.status(500).json({error:err.message})
    })
})

server.post('/all-latest-blogs-count',(req,res)=>{
    //passing the basis on which the count is done
    Blog.countDocuments({draft: false})
    .then(count=>{
        return res.status(200).json({totalDocs:count})
    })
    .catch(err=>{
        console.log(err.message);
        return res.status(500).json({error:err.message})
    })

})

//searching the blog
server.post('/search-blogs',(req,res)=>{
    let { tag,query,page,limit,eliminate_blog}=req.body;
    let findQuery;
    if(tag){
        findQuery={tags:tag,draft:false,blog_id:{$ne:eliminate_blog}};
    }
    else if(query){
        findQuery={draft:false,title:new RegExp(query,'i')}
    }
    let maxLimit3=limit ? limit:5;
    Blog.find(findQuery)
    .populate("author","username name photolink- -_id")
    .sort({"publishedAt":-1})
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page-1)*maxLimit3)
    .limit(maxLimit3)  
    .then(blogs=>{
        return res.status(200).json({blogs})
    })
    .catch(err=>{
        return res.status(500).json({error:err.message})
    })
})

server.post('/search-blogs-count',(req,res)=>{

    let { tag,query }=req.body;
    let findQuery;
    if(tag){
        findQuery={tags:tag,draft:false};
    }
    else if(query){
        findQuery={draft:false,title:new RegExp(query,'i')}
    }
    Blog.countDocuments(findQuery)
    .then(count=>{
        return res.status(200).json({totalDocs:count})
    })
    .catch(err=>{
        console.log(err.message);
        return res.status(500).json({error:err.message})
    })

})

server.post('/search-users',(req,res)=>{
    let {query}=req.body;

    User.find({"username":new RegExp(query,'i')})
    .limit(25)
    .select("name username photolink-_id")
    .then(users=>{
        console.log(users);
        return res.status(200).json({users})
    })
    .catch(err=>{
        return res.status(500).json({error:err.message})
    })
})



server.post('/create-blog',(req,res)=>{

   // console.log(req.body)
    //return res.json(req.body)
    //let authorId=User._id;

    //validating the data from front end
    //draft key we will send only when we will we click on save draft and make request
    let{authorId,title , des , banner , tags , content , draft,id}=req.body;

    if(!draft){
    if(!title.length){
        return res.status(403).json({error:"Title is required to publish the BLOG"});
    }

    if(!des.length || des.length >200){
        return res.status(403).json({error:"Description must be provided but under 200 characters.(including spaces"});
    }

    if(!banner.length){
        return res.status(403).json({error:"A banner image is required to publish the blog"});
    }

    if(!content.blocks.length){
        return res.status(403).json({error:"Blog content cannot be empty"});
    }

    if(!tags.length || tags.length>10){
        return res.status(403).json({error:"provide tags in order to publish the blog .At Max 10 tags"})
    }
    }
    //storing data in database

    //converting the tags to lowercase to store efficiently
    tags=tags.map(tag=>tag.toLowerCase());

    //creating blog id for a blog
    //replacing char that are not alphabets or numbers with space and then removing spaces because we cant have spaces in url
    let blog_id=id || title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, "-").trim()+nanoid();
    
    console.log("blog id generated",blog_id);


    if(id){

        Blog.findOneAndUpdate({blog_id},{title,des,banner,content,tags,draft:draft ? draft:false})
        .then(()=>{
            return res.status(200).json({id:blog_id});
        })
        .catch(err=>{
            return res.status(500).json({error:err.message})
        })
    }else{

        let blog =new Blog({
            title,des,banner,content,tags,author:authorId,blog_id,draft:Boolean(draft)
        })
    
    
        blog.save().then(async blog=>{
            let increamentVal =draft ? 0 :1;
            await User.findOneAndUpdate({id:authorId},{$inc : {"account_info.total_posts":increamentVal},$push :{"blogs":blog._id}})
            .then(user=>{
                console.log("blog creted successfully");
                return res.status(200).json({ id:blog.blog_id})
            })
            .catch(err=>{
                return res.status(500).json({error:"Failed to update total no of posts"})
            })
        })
        .catch(err=>{
            return res.status(500).json({error:err.message})
        })
    }
})

server.post('/get-blog',(req,res)=>{
    let{ blog_id,draft,mode}=req.body;

    let incrementalVal=mode !== 'edit'?1:0;
    Blog.findOneAndUpdate({blog_id},{$inc:{"activity.total_reads":incrementalVal}})
    .populate("author","name username")
    .select("title des content  banner activity publishedAt blog_id tags")
    .then(blog=>{
        User.findOneAndUpdate({"username":blog.author.username},{
            $inc:{"account_info.total_reads":incrementalVal}
        }).catch(err=>{
            return res.status(500).json({error:err.message})
        })

        if(blog.draft && !draft){
            return res.status(500).json({error:"you are trying to access a draft that is actually not a draft or not present"})
        }
        return res.status(200).json({blog})
    })
    .catch(err=>{
        return res.status(500).json({error:err.message})
    })

})

//below all 3 require verify JWT
server.post('/like-blog',(req,res)=>{
    let {user_id,_id,isLikedByUser}=req.body;
    let incrementVal1 =!isLikedByUser ? 1:-1;

    Blog.findOneAndUpdate({_id},{$inc :{"activity.total_likes":incrementVal1}})
    .then(blog=>{
        if(isLikedByUser){
            let like=new Notification({
                type:"like",
                blog:_id,
                notification_fo:blog.author,
                user:user_id
            })
            like.save().then(notification=>{
                return res.status(200).json({liked_by_user:true})
            })
        }
        else{
            Notification.findOneAndUpdate({user:user_id,blog:_id,type:"like"}) 
            .then(data=>{
                return res.status(200).json({liked_by_user:false});
            })
            .catch(err=>{
                return res.status(500).json({error:err.message});
            })
        }
    })
})

server.post("/isliked-by-user",(req,res)=>{
    let {user_id,_id}=req.body;
    Notification.exists({user:user_id,type:"like,blog:_id"}).then(result=>{
        return res.status(200).json({result})
    }).catch(err=>{
        return res.status(500).json({err:err,message})
    })
})


server.post("/user-written-blogs",verifyJWT,(req,res)=>{
    let user_id=req.user;
    let {page,draft,query,deletedDocCount}=req.body;
    let maxLimit=5;
    let skipDocs=(page-1)*maxLimit;
    if(deletedDocCount){
        skipDocs-=deletedDocCount;
    }
    Blog.find({author:user_id,draft,title:new RegExp(query,'i')})
    .skip(skipDocs)
    .limit(maxLimit)
    .sort({publishedAt:-1})
    .select("title banner publishedAt blog_id activity des draft -_id")
    .then(blogs=>{
        return res.status(200).json({blogs})
    })
.catch(err=>{
    return res.status(500).json({error:err.message});
})
})

server.post("/user-written-blogs-count",verifyJWT,(req,res)=>{
    let user_id=req.user;
    let {draft,query}=req.body;
    Blog.countDocuments({author:user_id,draft,title:new RegExp(query,'i')})
    .then(count=>{
        return res.status(200).json({totalDocs:count})
    })
    .catch(err=>{
        console.log(err);
        return res.status(500).json({error:err.message});
    })
})

server.post("/delete-blog",verifyJWT,(req,res)=>{
    let user_id=req.user;
    let {blog_id}=req.body;
    Blog.findOneAndDelete({blog_id})
    .then(blog=>{
        Notification.deleteMany({blog:blog_id}).then(data=> console.log('notifications deleted'));
        User.findOneAndUpdate({_id:user_id},{$pull:{blog:blog._id},$inc:{"account_info.total_posts":-1}})
        .then(user=>console.log('Blog deleted'));
        return res.status(200).json({status:'done'});
    })
    .catch(err=>{
        return res.status(500).json({error:err.message})
    })
})





// server.post('/create-post',verifyJWT,(req,res)=>{
//      let authorId=User._id;
//      let{ des , draft , id }=req.body;
 
//      if(!draft){
 
//      if(!des.length || des.length >500){
//          return res.status(403).json({error:"Description must be provided but under 500 characters.(including spaces"});
//      }
//     let post_id = 'post-' + nanoid(); 
//      console.log("blog id generated",post_id);
//      if(id){
 
//          Blog.findOneAndUpdate({post_id},{des,draft:draft ? draft:false})
//          .then(()=>{
//              return res.status(200).json({id:post_id});
//          })
//          .catch(err=>{
//              return res.status(500).json({error:err.message})
//          })
//      }else{         let post =new Forum({
//              des,author:authorId,post_id,
//             //  draft:Boolean(draft),
//          })
//          post.save().then(async post=>{
//              let increamentVal =draft ? 0 :1;
//              await User.findOneAndUpdate({id:authorId},{$inc : {"account_info.total_posts":increamentVal},$push :{"posts":post._id}})
//              .then(user=>{
//                  console.log("post created successfully");
//                  return res.status(200).json({ id:post.post_id})
//              })
//              .catch(err=>{
//                  return res.status(500).json({error:"Failed to update total no of posts"})
//              })
//          })
//          .catch(err=>{
//              return res.status(500).json({error:err.message})
//          })
//      }
//  }
//     });
 
//  server.post('/get-post',(req,res)=>{
//      let{ post_id,draft,mode}=req.body;
//      if (!post_id) {
//         return res.status(400).json({ error: "Post ID is required." });
//     }

//      let incrementalVal=mode !== 'edit'?1:0;
//      Forum.findOneAndUpdate({post_id},{$inc:{"activity.total_reads":incrementalVal}})
//      .populate("author","name username")
//      .select("des activity publishedAt post_id ")
//      .then(post=>{
//          User.findOneAndUpdate({"username":post.author.username},{
//              $inc:{"account_info.total_reads":incrementalVal}
//          }).catch(err=>{
//              return res.status(500).json({error:err.message})
//          })
 
//          if(post.draft && !draft){
//              return res.status(500).json({error:"you are trying to access a draft that is actually not a draft or not present"})
//          }
//          return res.status(200).json({post})
//      })
//      .catch(err=>{
//          return res.status(500).json({error:err.message})
//      })
 
//  })

// //  server.post('/get-post', (req, res) => {
// //     let { post_id, draft, mode } = req.body;

// //     // Validate post_id
// //     if (!post_id) {
// //         return res.status(400).json({ error: "Post ID is required." });
// //     }

// //     let incrementalVal = mode !== 'edit' ? 1 : 0;

// //     Forum.findOneAndUpdate({ post_id }, { $inc: { "activity.total_reads": incrementalVal } })
// //         .populate("author", "name username")
// //         .select("des activity publishedAt post_id")
// //         .then(post => {
// //             // Handle case where post is not found
// //             if (!post) {
// //                 return res.status(404).json({ error: "Post not found." });
// //             }

// //             // Update user's total reads
// //             User.findOneAndUpdate({ "username": post.author.username }, { $inc: { "account_info.total_reads": incrementalVal } })
// //                 .catch(err => {
// //                     return res.status(500).json({ error: err.message });
// //                 });

// //             // Check for draft access
// //             if (post.draft && !draft) {
// //                 return res.status(403).json({ error: "You are trying to access a draft post." });
// //             }

// //             return res.status(200).json({ post });
// //         })
// //         .catch(err => {
// //             return res.status(500).json({ error: err.message });
// //         });
// // });

// server.get('/latest-posts',(req,res)=>{
//     let maxLimit=5;
//     Blog.find({draft:false}).
//     populate("author", "username name -_id")
//     .sort({"publishedAt":-1})
//     .select("post_id des activity publishedAt -_id")
//     .limit(maxLimit)
//     .then(posts=>{
//         console.log(posts);
//         return res.status(200).json({posts:posts})  
//     })
//     .catch(err=>{

//         console.log(err);
//         return res.status(500).json({error:err.message})
//     })
// })

// // server.get('/latest-posts', (req, res) => {
// //     let maxLimit = req.query.limit ? Math.min(parseInt(req.query.limit), 10) : 5; // Allow a max limit of 10

// //     Blog.find({ draft: false })
// //         .populate("author", "username name -_id")
// //         .sort({ "publishedAt": -1 })
// //         .select("post_id des activity publishedAt -_id")
// //         .limit(maxLimit)
// //         .then(posts => {
// //             console.log(posts);
// //             return res.status(200).json({ posts: posts.length ? posts : [] }); // Ensure empty array is returned if no posts
// //         })
// //         .catch(err => {
// //             console.log(err);
// //             return res.status(500).json({ error: err.message });
// //         });
// // });

// server.post('/search-posts',(req,res)=>{
//     let { tag,query,page,limit,eliminate_post}=req.body;
//     let findQuery;
//     if(tag){
//         findQuery={tags:tag,draft:false,post_id:{$ne:eliminate_post}};
//     }
//     else if(query){
//         findQuery={draft:false,des:new RegExp(query,'i')}
//     }
//     let maxLimit3=limit ? limit:5;
//     Blog.find(findQuery)
//     .populate("author","username name photolink- -_id")
//     .sort({"publishedAt":-1})
//     .select("post_id des activity publishedAt -_id")
//     .skip((page-1)*maxLimit3)
//     .limit(maxLimit3)  
//     .then(posts=>{
//         return res.status(200).json({posts})
//     })
//     .catch(err=>{
//         return res.status(500).json({error:err.message})
//     })
// })

// // server.post('/search-posts', async (req, res) => {
// //     const { tag, query, page = 1, limit = 5, eliminate_post } = req.body;

// //     // Validation
// //     if (page < 1 || limit < 1) {
// //         return res.status(400).json({ error: "Invalid page or limit value" });
// //     }

// //     let findQuery = { draft: false }; // Default query
// //     if (tag) {
// //         findQuery.tags = tag;
// //         findQuery.post_id = { $ne: eliminate_post };
// //     } else if (query) {
// //         try {
// //             findQuery.des = new RegExp(query, 'i');
// //         } catch (err) {
// //             return res.status(400).json({ error: "Invalid search query" });
// //         }
// //     }

// //     try {
// //         const posts = await Blog.find(findQuery)
// //             .populate("author", "username name photolink -_id")
// //             .sort({ publishedAt: -1 })
// //             .select("post_id des activity publishedAt -_id")
// //             .skip((page - 1) * limit)
// //             .limit(limit);

// //         return res.status(200).json({ 
// //             posts, 
// //             currentPage: page, 
// //             limit 
// //         });
// //     } catch (err) {
// //         return res.status(500).json({ error: err.message });
// //     }
// // });

// server.post("/delete-post",verifyJWT,(req,res)=>{
//     let user_id=req.user;
//     let {post_id}=req.body;
//     Blog.findOneAndDelete({post_id})
//     .then(post=>{
//         Notification.deleteMany({post:post_id}).then(data=> console.log('notifications deleted'));
//         User.findOneAndUpdate({_id:user_id},{$pull:{posts:post._id},$inc:{"account_info.total_posts":-1}})
//         .then(user=>console.log('post deleted'));
//         return res.status(200).json({status:'done'});
//     })
//     .catch(err=>{
//         return res.status(500).json({error:err.message})
//     })
// })


// // server.post('/like-post',(req,res)=>{
// //     let {user_id,_id,isLikedByUser}=req.body;
// //     let incrementVal1 =!isLikedByUser ? 1:-1;

// //     Blog.findOneAndUpdate({_id},{$inc :{"activity.total_likes":incrementVal1}})
// //     .then(blog=>{
// //         if(isLikedByUser){
// //             let like=new Notification({
// //                 type:"like",
// //                 blog:_id,
// //                 notification_fo:blog.author,
// //                 user:user_id
// //             })
// //             like.save().then(notification=>{
// //                 return res.status(200).json({liked_by_user:true})
// //             })
// //         }
// //         else{
// //             Notification.findOneAndUpdate({user:user_id,blog:_id,type:"like"}) 
// //             .then(data=>{
// //                 return res.status(200).json({liked_by_user:false});
// //             })
// //             .catch(err=>{
// //                 return res.status(500).json({error:err.message});
// //             })
// //         }
// //     })
// // })

// // server.post("/isliked-by-user",(req,res)=>{
// //     let {user_id,_id}=req.body;
// //     Notification.exists({user:user_id,type:"like,blog:_id"}).then(result=>{
// //         return res.status(200).json({result})
// //     }).catch(err=>{
// //         return res.status(500).json({err:err,message})
// //     })
// })



const forumRoutes = require('./routes/forumRoutes');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const mongoose = require('mongoose');

// const mongoURI = process.env.DB_Location;

// mongoose
//   .connect(mongoURI) // No additional options needed for Mongoose 6+
//   .then(() => console.log('Connected to MongoDB'))
//   .catch((err) => console.error('Error connecting to MongoDB:', err));

// // Routes
 server.use('/api/posts', forumRoutes);

server.listen(PORT, () => {
    console.log(`Listening on port -> ${PORT}`);
});
