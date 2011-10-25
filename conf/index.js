var fs = require('fs'),
conf = {},
conf_files = fs.readdirSync(__dirname);

conf_files.forEach(function(c){ 
  if (c.indexOf('.swp')===-1){
    conf[c.replace('.js','')] = require('./'+c);
  }
});

module.exports = conf;
