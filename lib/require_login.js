/*
 * Require login
 */

module.exports = function(req, res, next){
  console.log('checking login', req.session.logged_in);
  if (req.session.logged_in){
    return next();
  } else {
    console.log('user not logged in');
    res.render('logged_out');
  }
};
