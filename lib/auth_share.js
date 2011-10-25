/* This is a POST to socializations.json 
 * The user is sharing something
 */


var mustHaveKeys = ['destination','broadcast_id','comment'];

function validateKeys(req, res, next){

  var errors = [];
  req.post_params = {};

  mustHaveKeys.forEach(function(key){
    if (req.body.hasOwnProperty(key)){
      req.post_params[key] = req.body[key];
    } else {
      errors.push({code:401, msg:'Body must contain parameter: '+key});  
    }
  });

  if (errors.length){
    return res.sendError(errors.shift());
  } else {
    return next();
  }

}

function validateDestination(req, res, next){

  var _destination = req.post_params.destination.split(',');
  if (!(Array.isArray(_destination) && _destination.length)){
    return res.sendError({code:401, msg:"Invalid 'destination' parameter"});
  }

  req.post_params.destination = {}; 
  _destination.forEach(function(dest){
    req.post_params.destination[dest] = 1;
  });
  
  if (!(req.post_params.destination.hasOwnProperty('facebook') || req.post_params.destination.hasOwnProperty('twitter') || req.post_params.destination.hasOwnProperty('tumblr') || req.post_params.destination.hasOwnProperty('email'))){
    return res.sendError({code:401, msg:'Destination must be one of: facebook, twitter, tumblr or email'});
  } else {
    return next();
  }
}

function validateEmailTo(req, res, next){
  if (req.post_params.destination.email && !req.body.to){
    return res.sendError({code:401, msg:'If destination includes "email", "to" must be defined as a list of comma-delimited email addresses'});
  } else {
    req.post_params.to = req.body.to;
    return next();
  }
}


module.exports = function(req, res, next){
  validateKeys(req, res, function(){
    validateDestination(req, res, function(){
      validateEmailTo(req, res, next);
    });
  });
};
