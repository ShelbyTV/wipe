/*
 * This is a hack to help lazy iOS devs
 */

var introduced_properties ={
  'broadcasts':['owner_watch_later']
}


module.exports = function(data, type){
  data.forEach(function(d){
    introduced_properties[type].forEach(function(p){
      if (!(d.hasOwnProperty(p))){
        d[p] = 'false';
      }
    });
  });

  return data;
};
