var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

// var SupplyApiRouter = require('./routes/supplyapi');
// var PricesApiRouter = require('./routes/pricesapi');
// var binanceApiRouter = require('./routes/binanceapi');

var exchangeApiRouter = require('./routes/exchangeapi');
var terraApiRouter = require('./routes/terraapi');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// app.use('/supplyapi', SupplyApiRouter);
// app.use('/pricesapi', PricesApiRouter);
// app.use('/binanceapi', binanceApiRouter);

app.use('/exchangeapi', exchangeApiRouter);
app.use('/terraapi', terraApiRouter);

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
