const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apifeatures');

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    //const newDoc = new Doc({});
    //newDoc.save();
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      statues: 'success',
      data: {
        tour: newDoc
      }
    }); // 201 - created
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query) // Tour.find() creates new query object // req.query parametrs from url
      .filter()
      .sort()
      .limitFields()
      .paginate();
    //const docs = await features.query.explain();
    const docs = await features.query;

    //SEND RESPONSE
    res.status(200).json({ status: 'success', results: docs.length, data: { docs } });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    //Tour.findOne({_id: req.params.id})
    const query = Model.findById(req.params.id);
    //populate embed guides in tour
    if (popOptions) query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('There is no ID like that', 404));
    }
    res.status(200).json({
      statues: 'success',
      date: res.responseTime,
      data: {
        data: doc
      }
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //true for return update document
      runValidators: true
    });
    if (!doc) {
      return next(new AppError('There is no ID like that', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    console.log(doc);
    if (!doc) {
      return next(new AppError('There is no ID like that', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
