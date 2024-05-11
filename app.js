const express = require("express");
const app = express();
const path = require("path");
const usermodel = require("./models/user");
const postmodel=require("./models/post");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const post = require("./models/post");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieparser())
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/login",  (req, res) => {
  
  res.render("log");
});
app.get("/profile",isLoggedIn, async (req, res) => {
  let user=await usermodel.findOne({email:req.user.email}).populate("post");
  
  res.render("feed",{user});
});
app.get("/read",async (req,res)=>{
  let all=await postmodel.find().populate("user","name");

  //console.log(all.user.toString())

  res.render("allpst",{all})
});
app.post("/post",isLoggedIn, async (req, res) => {
  let user=await usermodel.findOne({email:req.user.email});
  

  let post=await postmodel.create({
    user:user._id,
    content:req.body.content,
  });
  user.post.push(post._id);
  await user.save();
  res.redirect("/profile");

});


app.post("/create", async (req, res) => {
  let { name, email, password } = req.body;
  let user = await usermodel.findOne({ email });
  if (user) return res.status(500).send("user already exist");

  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {
      let user = await usermodel.create({
        name,
        email,
        password: hash,
      });
      let token = jwt.sign({ email: email, userid: user._id }, "ahhhhhh");
      res.cookie("token", token);
      res.send("registerd");
    });
  });
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await usermodel.findOne({ email });
  if (!user) return res.status(400).redirect("/");

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "ahhhhhh");
      res.cookie( "token",  token);
      
      res.status(200).redirect("/profile");
    } else res.redirect("/");
  });
});


app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  if(req.cookies.token===""){
 res.redirect("/login");
  }else{
    let data=jwt.verify(req.cookies.token,"ahhhhhh");
    req.user=data;

    next();
  }
    
  

}

app.listen(3000);
