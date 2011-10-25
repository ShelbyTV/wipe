module.exports = function(req, res, next){
  res.sendError = function(err){
    res.writeHead(err.code, {'Content-Type': 'application/json'});
    res.write(JSON.stringify({"err":err.msg}));
    res.end();
  };
  return next();
};
