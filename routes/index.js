var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const upload = require("./multer");
const localStrategy = require("passport-local");

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render("index" , {nav:true});
});



router.get("/register" , (req,res)=>{
  res.render("register" , {nav:false});
})

router.get("/profile" , isLoggedIn , async function(req,res,next){
  // user ka data user naam se bhej diya profile page pe so that jo user logged in hai uski image 
  //upload kar sake.Basically profile.ejs pe user kar sake {user} ko

  const user = 
  await userModel
      .findOne({username: req.session.passport.user})
      .populate("posts")
  res.render("profile" , {user,nav:true});
});

router.get("/show/posts" , isLoggedIn , async function(req,res,next){
  const user = 
  await userModel
      .findOne({username: req.session.passport.user})
      .populate("posts")
  res.render("show" , {user,nav:true});
});

router.get("/feed" , isLoggedIn , async function(req,res,next){
  const user = await userModel.findOne({username: req.session.passport.user});
  const posts = await postModel.find()
  .populate("user")

  res.render("feed" , {user , posts , nav:true});
});


router.get("/add" , isLoggedIn , async function(req,res,next){
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("add" , {user,nav:true});
});


router.get("/edit" , isLoggedIn , async function(req,res,next){
  const user = 
  await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts")
  res.render("edit" , {user , nav:true})
});


router.post('/delete/:postId', async (req, res) => {
  try {
      const postId = req.params.postId;
      await postModel.findByIdAndDelete(postId);
      res.redirect('/profile');
  } catch (error) {
      console.error('Error deleting post:', error);
      res.redirect('/error');
  }
});


router.post('/change/:postId', upload.single('image'), async (req, res) => {
  try {
      const postId = req.params.postId;
      const newImage = req.file.filename; // Assuming Multer stores the file in req.file
      // Update the post in the database with the new image
      await postModel.findByIdAndUpdate(postId, { image: newImage });
      // Redirect the user to the profile page after making the changes
      res.redirect('/profile');
  } catch (error) {
      console.error('Error changing post:', error);
      // Handle errors appropriately, maybe redirect to an error page
      res.redirect('/error');
  }
});



router.post("/fileupload" , isLoggedIn , upload.single("image") , async function(req,res,next){
  const user = await userModel.findOne({username: req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect("/profile");
});

router.post("/createpost" , isLoggedIn , upload.single("postimage") , async function(req,res,next){
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename,
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
}); 



router.post("/register" , (req,res)=>{
  const data = new userModel({
    // LHS should match the name in the userSchema and RHS should match the name mentioned in the register input tag
    name: req.body.name,
    username: req.body.username,
    email: req.body.email,
    contact: req.body.contact,
  })

  //  userModel.register(data , req.body.password) returns a promise
  userModel.register(data , req.body.password)
  .then(()=>{
    passport.authenticate("local")(req,res,()=>{
        res.redirect("/profile");
    })
  })
});


router.post("/login" , passport.authenticate("local",{
  failureRedirect:"/",
  successRedirect:"/profile",
}) , (req,res,next)=>{

});

router.get("/logout" , isLoggedIn ,(req,res,next)=>{
  req.logout((err)=>{
    if(err){
      return next(err);
    }
    res.redirect("/");
  })
})

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
   return next();
  } 
  res.redirect("/");
}

module.exports = router;
