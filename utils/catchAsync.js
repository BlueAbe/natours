// This function take all errors and push them foward
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
