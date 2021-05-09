const lodash = require('lodash');

class APIFeatures {
  // query - query created by model
  // queryStr - parametrs from url
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    // 1A) Filtering
    const queryObj = lodash.clone(this.queryStr); // create copy of params object
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]); // remove page sort limit fields params from queryObj

    // 1B) Advanced filtering
    let queryString = JSON.stringify(queryObj); //change object to string
    queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); // modify string to mongoos form
    this.query.find(JSON.parse(queryString)); //use find no query
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt'); //default sort
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // default fields
    }
    return this;
  }

  paginate() {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
