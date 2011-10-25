var canUpdate = ['watched_by_owner', 'liked_by_owner'];


function verifyBoolean(val, cb){
  console.log(val);
  console.log(typeof val);
}

module.exports = function(req, res, next){
  var putBody = {};
  var errors = [];
  if (req.body){
  Object.keys(req.body).forEach(function(attr){
    if (canUpdate.indexOf(attr)!==-1){
      //verify that they are boolean
      if (req.body[attr].toString()==='true' || req.body[attr].toString()==='false'){
        putBody[attr] = req.body[attr];    
      } else {
        errors.push({code:401, msg:"Value of "+attr+" must be boolean"});
      }
    }
  });
  } else {
    errors.push({code:401, msg:"PUT request made with no body"});
  }
   
  if (errors.length){
    return res.sendError(errors.shift());
  }

  if (!Object.keys(putBody).length){
    if (Object.keys(req.body).length){
      res.sendError({code:401, msg:"Can only update properties: "+canUpdate.join(', ')});  
    } else {
      return res.sendError({code:401, msg:"You must provide data in PUT request body"});
    }
  } else {
    next(putBody);
  }
};
