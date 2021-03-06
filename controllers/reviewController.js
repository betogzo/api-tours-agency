const catchAsync = require('./../utils/catchAsync');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

//middleware to grab tour and user id before createReview
exports.setTourAndUserIds = async (req, res, next) => {
  //allowing nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  /* if there is a tourId param, then find all the reviews on that tour
  and if there's no tourId, filter will be empty and find method will 
  find all reviews regardless of their tour */
  if (req.params.tourId) filter = { tour: req.params.tourId };
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      review
    }
  });
});

exports.checkIfAuthorMatch = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (req.user.role === 'user' && review.user.id !== req.user.id)
    return next(
      new AppError(
        `Permission denied. You're not the author of this review!`,
        403
      )
    );
  next();
});

exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
