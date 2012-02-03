
/*
 * GET home page.
 */

var config = require('../config.js');
var require_login = require('../lib/require_login.js');
var wipe_user = require('../lib/wipe_interface.js');

exports.index = function(req, res){
  res.render('utils');
};

exports.login = function(req, res){
  console.log('login attempted', req.body);
  if (req.body.username === config.username && req.body.password === config.password){
    req.session.logged_in = true;
    res.redirect('/');
  } else {
    res.render('logged_out', {msg : 'Sorry, bad username or password'});
  }
};

exports.render_wipe = function(req, res){
  res.render('wipe');
};

exports.wipe_user = function(req, res, DB){
  wipe_user(DB, req.body.username, function(e, data){
    console.log(e, data);
    res.send({e:e,data:data});
  });
};
