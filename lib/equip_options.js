function equipSendError(res){

  res.sendError = function(err){
    res.writeHead(err.code, {'Content-Type': 'application/json'});
    res.write(JSON.stringify({"err":err.msg}));
    res.end();
  };
  return res;
}

function sepOptions(req){
  var options = ['limit', 'skip', 'sort', 'fields']
  , opts = {};
  options.forEach(function(opt){
    if (req.query.hasOwnProperty(opt)){
      opts[opt] = req.query[opt];     
    }
  });
  req.query_options = opts; 
  return req;
}

function authOptions(req, res, success, failure){
  if (!req.query_options) return success();
  
  var sort = function(val, failure, next){
    if (!val) return next(false);
    if (val=='asc' || val=='desc'){
      req.query_options.sort = [['created_at', val]];
      return next();
    } else {
      return failure({code:404, msg:"Sort must be one either: 'asc' or 'desc'"});
    }
  };

  var skip = function(val, failure, next){
    if (!val) return next(false);
    if (val/1){
      return next();
    } else {
      return failure({code:404, msg:"Skip must be a number"});
    }
  };

  var limit = function(val, failure, next){
    if (!val) return next(false);
    if (!(val/1)){
      return failure({code:404, msg:"Limit must be a number"});
    }
    if (val>200){
      return failure({code:404, msg:"Value of limit cannot be higher than 200"});
    }
    next(val); 
  }
  
  sort(req.query_options.sort, res.sendError, function(){
    skip(req.query_options.skip, res.sendError, function(){
      limit(req.query_options.limit, res.sendError, function(res){
        if (!res) req.query_options.limit = 200;
        return success();
      });
    });
  });
}


module.exports = function(req, res, next){
  // assign sendError to res
  res = equipSendError(res);

  // separate options from req.query
  req = sepOptions(req); 

  // auth options
  authOptions(req, res, function(){ //success clause
    return next();
  }, function(e){ //failure clause
    return res.sendError({code:404, msg:e});
  });
}
