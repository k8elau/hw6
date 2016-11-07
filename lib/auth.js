var passport = require('passport');
var LocalStrategy = require('passport-local');
var TwitterStrategy = require('passport-twitter');
var User = require('../models/user');

//this link taught me to instead of visiting localhost:3000, to visit 127.0.0.1, since that's what twitter uses instead of localhost
// http://stackoverflow.com/questions/16346458/error-failed-to-find-request-token-in-session 

//this link told me to put in a callback URL (that started with 127.0.0.1, not localhost) in the twitter app settings EVEN THOUGH IT WASN'T REQUIRED BY TWITTER

//http://stackoverflow.com/questions/21170531/desktop-applications-only-support-the-oauth-callback-value-oob-oauth-request-t

module.exports = function(app, options){
    return{
        init: function(){
            //got help with the syntax of the inside of the TwitterStrategy from here
            //https://github.com/passport/express-4.x-twitter-example/blob/master/server.js
            passport.use(new TwitterStrategy({
                consumerKey: process.env.CONSUMER_KEY,
                consumerSecret: process.env.CONSUMER_SECRET,
                callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
            },
                                             
    //learned the User.findOne code from this stackoverflow post                                
    //http://stackoverflow.com/questions/20431049/what-is-function-user-findorcreate-doing-and-when-is-it-called-in-passport
              function(token, tokenSecret, profile, done) {
    User.findOne({ twitterId: profile.id }, function (err, user) {
        if(user){
            res.redirect('/')
            return done(err, user);
        }
      if(err){return done(err, user);
             }
        if(!user){
            user = new User({
                name: profile.displayName
            });
            user.save(function(err){
                if(err) console.log(err);
                return done(err, user);
            });
        } else{
            return done(err, user);
        }
        })
    }));
            passport.serializeUser(function(user,done){
                done(null, user._id);
            });
            passport.deserializeUser(function(id, done){
                User.findById(id, function(err, user){
                    //handle error
                    if(err || !user){
                        return done(err, null);
                }
                    done(null, user);
                });
            });
            
            app.use(passport.initialize());
            //passport put user data into the session
            app.use(passport.session());
            app.use(function(req, res, next){
                //add user to res.locals
                //passport adds req.user
                //we can use res.locals.user in our views
                res.locals.user = req.user;
                next();
            });
        },
        registerRoutes:function(){
            app.get('/signup', function(req, res, next){
               res.render('signup', {header: 'Sign Up'}) 
            });
            
            app.post('/signup', function(req, res, next){
                var newUser = new User({
                    username: req.body.username
                });
                
                User.register(newUser, req.body.password, function(err,user){
                    if(err){
                        console.log('signup error!', err);
                        
                        //return flash message to notify user of the error
                        return res.render('signup', {
                            flash:{
                                type:'negative',
                                header:'Signup Error',
                                body:err.message
                            },
                            header: 'Sign Up'
                        });
                    }
                    
                //if success
                    passport.authenticate('twitter')(req, res, function(){
                       req.session.flash = {
                           type: 'positive',
                           header: 'Registration Success',
                           body: 'You signed up as ' + user.name
                       }
                       res.redirect('/');
                    });
                });
            });
            
            app.get('/login', function(req, res, next){
               res.render('signup', {header: 'Log In'}); 
            });
            
            app.post('/login', passport.authenticate('twitter'), function(req, res){
                req.session.flash = {
                    type: 'positive',
                    header: 'Signed In',
                    body: 'Welcome, ' + user.name
                }
            });
            
             app.get('/logout', function(req, res, next){
               req.logout();
                 req.session.flash = {
                     type:'positive',
                     header: 'Signed out',
                     body: 'Successfully signed out'
                 }
                 res.redirect('/');
            });
            
//originally the bellow routes said (app.get('/twitterlogin/callback') and then later (app.get('/twitter')) but this stackoverflow helped me realize that twitter automatically wants the call back URL to be /auth/twitter' and '/auth/twitter/callback' even though it is an auth file already)
            
//http://stackoverflow.com/questions/19390204/cannot-get-auth-twitter-callback-while-using-twitter-oauth-in-nodejs

            app.get('/auth/twitter', passport.authenticate('twitter'),
                   function(req, res){});
            
            app.get('/auth/twitter/callback', 
                    passport.authenticate('twitter', {
                failureRedirect: '/login'
            }),
                function(req, res){
                //having trouble extracting profile display name here
                req.session.flash = {
                     type:'positive',
                     header: 'Signed out',
                     body: 'You successfully signed in with Twitter!'
                 }
                res.redirect('/');
            });  
            
        }
    };  
};

