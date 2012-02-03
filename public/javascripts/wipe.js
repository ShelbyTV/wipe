var Wipe = {
  init : function(){
    this.assignWipeClick();

  },
  assignWipeClick : function(){
    var self = this;
    $('#submit-wipe').click(function(){
      $('#wipe-error').hide();
      $('#wipe-success').hide();
      var username = $('#wipe-username').val();
      if (!username.length){
        return false;
      }
      $("#wipe-loading").show();
      $.ajax({
        type:'POST',
        url:'wipe',
        data:{ "username" : username},
        success: self.displayResults
      });
    });
  },
  displayResults : function(data){
    $('#wipe-loading').hide();
    if (data.e){
      return Wipe.renderError(data.e);
    }
    if (data.data){
      return Wipe.renderSuccess(data.data);
    }
  },
  renderError : function(e){
    $('#wipe-error').text(e);
    $('#wipe-error').show();
  },
  renderSuccess : function(data){
    var msg = '<strong> It worked. </strong> We wiped '+data.users+' user(s), '+data.channels+' channel(s) and ' +data.broadcasts+' broadcasts';
    $('#wipe-success').html(msg);  
    $('#wipe-success').show();
  }
  
};
