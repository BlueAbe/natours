const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [5, 'A tour name must have more or equal then 40 characters']
      //validate: [validator.isAlpha, 'Tour must only contain characters'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficult'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, 'Rateing must be below 5'],
      min: [1, 'Rateing must be abve 1'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price; //this - points to created new document not for update document
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have description']
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    //Array means something like subdocument
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    //child's reference
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }] // reference to user
    //guides: Array - Embedding guides
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
//PART: INDEXES
//single index
//tourSchema.index({ price: 1 });
//compound index
tourSchema.index({ price: 1, ratingsAverage: 1 });
tourSchema.index({ startLocation: '2dsphere' }); //special index to use geo coordinates in find and aggregation

//PART: VIRTUAL FIELDS
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//Virtual populate
//this virtual field arises from reviews which are referenced (parent type) to this tour
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//PART: DOCUMENT MIDDLEWARE
//pre runs before .save() and .create()
tourSchema.pre('save', function(next) {
  //console.log(this);
  this.slug = slugify(this.name, { lower: true }); //this - points to document
  next();
});
tourSchema.post('save', (doc, next) => {
  //console.log(doc);
  next();
});

//Embedding guides in tour document
// iteration with promises
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

//PART: QUERY MIDDLEWARE
// ^find - regular expression for all types find comand
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } }); //this - points to query
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  //console.log(docs)
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

//PART: AGGREGATION MIDDLEWARE
//its comment because it makes confilct with geolocation aggregate
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema); // we use singular noun name "Tour" to tours collection
module.exports = Tour;
