//jshint esversion:6
require('dotenv').config()
const bcrypt = require('bcryptjs');
const encrypt = require('mongoose-encryption');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const { urlencoded } = require('body-parser');
const mongoose = require('mongoose');
const session= require('express-session');
const passoport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended : true}) );

app.use(session({
    secret: 'this is my secret', // try and update the value of secret from the exvironmental vars
    resave: false,
    saveUninitialized: true
  }));
app.use(passport.initialize());
app.use(passport.session())

passport.use(new GoogleStrategy({
    clientID : process.env.CLIENT_ID,    // remember to configure the DOTENV before using it else you will get an error
    clientSecret : process.env.SECRET,
    callbackURL : "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"   // this is provoided additionally other than the documentation since google recieves info from google+ id but since it is deprecating then we should use this addON so that google can fetch the data from main googel account
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser : true, useUnifiedTopology: true});

const userSchema =new mongoose.Schema({
    email : String,
    password : String,
    googleId : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User',userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
     done(err, user);
    });
});

app.get('/',(req,res)=>{
    res.render('home');
})
app.get('/login',(req,res)=>{
    res.render('login');
})
app.get('/register',(req,res)=>{
    res.render('register');
})
app.get('/secrets',(req,res)=>{
    if(req.isAuthenticated()){
        res.render('secrets');
    }else{
        res.redirect('/login');
    }
})
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })  // here google as the string argument refers to the Strategy, we have used a local strategy earlier
);
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });



app.post('/register',(req,res)=>{
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) { 
            console.log(err);
            res.redirect('/register');
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect('/secrets')
            })
            }
        })
    });


app.post('/login',(req,res)=>{
   const user=new User({
       username : req.body.username,
       password : req.body.password
   });
   req.login(user, (err)=>{
       if(err){
           console.log(err);
           res.redirect('/login')
       }else{
           passport.authenticate('local')(req, res, ()=>{
               res.redirect('/secrets');
           })
       }
   })
})

app.get('/logout',(req, res)=>{
    req.logout();
    res.redirect('/');
})







app.listen(3000,()=>{
    console.log("server started at port 3000")
})
