const mongoose = require('mongoose');
const Tour = require('./toursModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have a text']
    },
    rating: {
      type: Number,
      max: [5, 'Rateing must be below 5'],
      min: [1, 'Rateing must be abve 1']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    //parent's reference
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'Review must belong to a user.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//PART: QUERY MIDDLEWARE
// ^find - regular expression for all types find comand

// reviewSchema.pre(/^find/, function(next) {
//   this.populate({
//     path: 'tour',
//     select: 'name'
//   }).populate({
//     path: 'user',
//     select: 'name photo'
//   });
//   next();
// });

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  //this points to a model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour);
});

//Update ratingsAverage in tours after update or delete review

// Solution I
// From documentation
//You cannot access the document being updated in pre('updateOne') or pre('findOneAndUpdate') query middleware. If you need to access the document that will be updated, you need to execute an explicit query for the document

reviewSchema.pre(/^findOneAnd/, async function(next) {
  // this points to query
  // we will get doc in that way
  console.log(this);
  this.r = await this.findOne(); //this.r - review doc
  next();
});
reviewSchema.post(/^findOneAnd/, async function() {
  //this.r = await this.findOne(); doesnt work here. query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

//Solution II
// reviewSchema.post(/^findOneAnd/, async function(doc) {
//   await doc.constructor.calcAverageRatings(doc.tour);
// });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
