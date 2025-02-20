var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exphbs = require('express-handlebars');
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
const Handlebars = require("handlebars");
const { allowInsecurePrototypeAccess } = require("@handlebars/allow-prototype-access");

var app = express();
var fileUpload = require('express-fileupload');
const db = require('./config/connection'); // Import connect from config
var session=require('express-session')


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine(
  "hbs",
  exphbs.engine({ // Use `exphbs.engine()` in newer versions
    extname: "hbs",
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    defaultLayout: "layout",
    layoutsDir: path.join(__dirname, "views/layout/"),
    partialsDir: path.join(__dirname, "views/partials/"),
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(session({
  secret: "Key",
  resave: false, // Prevents unnecessary session saving
  saveUninitialized: false, // Prevents empty sessions from being stored
  cookie: { maxAge: 600000 } // 10 minutes session
}));

app.use((req, res, next) => {
  next();
});
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});




db.connect()
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Failed to connect:', err));

// Routes setup
app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

