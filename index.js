//npm install
//npm install cookie-parser --save
//npm install express-session --save
//npm install connect-mongo --save

// load modules
var express = require('express');
var hbs = require('express-handlebars');
//var cookieParser = require('cookie-parser');
var session = require('express-session');
//using mongo to store data persistence problem
//mongo will create "sessions" collections automatically 
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');


// load .env (environment variables)
require('dotenv').config();

// create app
var app = express();
var PORT = process.env.PORT || 3000;

app.use(cookieParser());

// prevent people from tampering with cookies
//set cookieSecret in .env
//app.use(cookieParser(process.env.cookieSecret));
app.use(session({
    secret: process.env.cookieSecret,
    cookie: {
        httpOnly:true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
    saveUninitialized: true,
    //add session store
    store: new MongoStore({
        url: process.env.DB_URL
    })
}
));

//attach req.session.flash to res.locals
//lets us render this on the page
app.use(function(req, res, next){
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

// init handlebars
app.engine('handlebars', hbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// setup cookiePasrser and bodyParser middleware
//before our routes that depend on them
app.use(cookieParser({
    secret: process.env.cookieSecret,
}));

//add form fields to req.body, i.e. req.body.lalal
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

//connect ot database
mongoose.connect(process.env.DB_URL);

var options = {};
var auth = require('./lib/auth')(app, options);
auth.init(); //setup middleware
auth.registerRoutes();

// home page
app.get('/', function(req, res) {
    //if(req.signedCookies.treat){
    if(req.session.treat){
        return res.render('view', {
            msg: 'You have a treat: ' + req.session.treat
        });
    }
  return res.render('view', {
    msg: 'No treats.'
  });
});

//set the cookie
app.get('/treat', function(req, res){
    req.session.treat = 'candy corn';
    req.session.flash = {
        type: 'positive',
        header: 'You got a treat',
        body: 'The treat is ' + req.session.treat
    }
   //res.cookie('treat', 'candy corn',{
       //httpOnly says users CAN'T CHANGE IT
       //you could change it (if httpOnly didn't exist) with document.cookie = "treat=donuts" somewhere in the console lol 
      //httpOnly: true,
     // signed: true
   //});
   res.redirect('/');
});

//get rid of cookies
app.get('/clear', function (req, res){
    delete req.session.treat;
    req.session.flash = {
        type: 'negative',
        header: 'No treat',
        body: 'Your bag is empty. :(' 
    }
    res.redirect('/');
})
// start server
app.listen(PORT, function() {
  console.log('listening on port ', PORT);
});