const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
//set secure http headers
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//body-parser
app.use(express.json({ limit: '10kb' }));

//sanitizing requests in order to prevent nosql injection attacks
app.use(
  mongoSanitize({
    onSanitize: () => {
      console.error('Request/query not allowed. Nice try ;)');
    }
  })
);

//data sanitizing against XSS attacks
app.use(xss());

//preventing parameter pollution
app.use(
  hpp({
    whitelist: [
      'price',
      'duration',
      'difficulty',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize'
    ]
  })
);

//serving static files
app.use(express.static(__dirname, 'public'));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//rate-limit (block too many requests)
const limiter = rateLimit({
  //allow 100 requests per IP per hour
  max: 100, //max requests
  windowMs: 60 * 60 * 1000, //time window in miliseconds
  message: 'Too many requests coming from your IP, try again in one hour.'
});
app.use('/api', limiter);

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//dealing with inexistent routes, mistyping etc (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
