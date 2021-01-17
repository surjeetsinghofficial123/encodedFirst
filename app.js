//jshint esversion:6
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


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser : true, useUnifiedTopology: true});

const userSchema =new mongoose.Schema({
    email : String,
    password : String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User',userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
