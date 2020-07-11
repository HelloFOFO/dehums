let createError = require('http-errors');
let express = require('express');
let session = require('express-session');
let path = require('path');
let cookieParser = require('cookie-parser');
let schedule = require('node-schedule');
let dbService = require('./service/dbService')
let logger = require('morgan');
let moment = require('moment')

let webRouter = require('./routes/webRouter');

let app = express();

app.locals.moment = moment

schedule.scheduleJob('30 05 * * *', dbService.job_update_sd_dehum_dd)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//注意,改下面的secret要小心
app.use(session({
    secret: 'rta',
//    store: new RedisStore(conf.redis),
    cookie : { maxAge : 180000000 },
    resave: false,
    saveUninitialized: true
}));

app.use(function(req, res, next){
    if(req.session && req.session.userName && !res.locals.localUserInfo){
        //如果有session,并且 res.locals.localUserInfo 为空
        res.locals.localUserInfo = req.session.userName;
    }else{
        res.locals.localUserInfo = {};
    }
    //console.log(res.locals.localUserInfo);
    next();
});

app.use('/', webRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
