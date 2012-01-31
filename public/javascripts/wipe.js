var Wipe = {
  init : function(){
    this.assignWipeClick();

  },
  assignWipeClick : function(){
    var self = this;
    $('#submit-wipe').click(function(){
      var username = $('#wipe-username').val();
      if (!username.length){
        return false;
      }
      self.renderWipeLoading();
      $.ajax({
        type:'POST',
        url:'wipe',
        data:{ "username" : username},
        success: self.displayResults
      });
    });
  },
  renderWipeLoading : function(){
    console.log('rendering wipe loading');
    $("#wipe-loading").show();
  }
  
};
