//jshint esversion:6

const encrypt = require('mongoose-encryption');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const { urlencoded } = require('body-parser');
const mongoose = require('mongoose');
const md5 = require('md5');

const app = express();

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended : true}) );

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser : true, useUnifiedTopology: true});

const userSchema =new mongoose.Schema({
    email : String,
    password : String
});


const User = new mongoose.model('User',userSchema);

app.get('/',(req,res)=>{
    res.render('home');
})
app.get('/login',(req,res)=>{
    res.render('login');
})
app.get('/register',(req,res)=>{
    res.render('register');
})

app.post('/register',(req,res)=>{
    const newUser = new User({
        email : req.body.username,
        password : md5(req.body.password)
    });
    newUser.save((err)=>{
        if(err){
            console.log(err);
        }else{
            res.render('secrets');
        }
    });
});

app.post('/login',(req,res)=>{
    const userName = req.body.username;
    const password= md5(req.body.password);

    User.findOne({email : userName},(err,foundUser)=>{
        if(err){
            console.log(err);
        }if(!foundUser){
            res.send("No user with that username is found");
        }if(foundUser){
            if(foundUser.password == password){
                res.render('secrets');  
            }
            else{
                res.send("Password is incorrect !")
            }
        }
    })
})








app.listen(3000,()=>{
    console.log("server started at port 3000")
})
