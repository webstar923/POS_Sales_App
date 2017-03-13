
var fb = (function(){
  // TODO get this data by config / localstorage / db
  var fbUrl = "amber-fire-5254.firebaseio.com",
  fbToken,fbObj;

  authSuccess = function(error, authData){
    if (error) {
        console.log("Firebase Authentication Failed!", error);
      } else {
        console.log("Firebase Authenticated successfully with payload:", authData);
      }
  }



  return {
    init : function(){
      fbObj = new Firebase(fbUrl);
      fbObj.authWithCustomToken(localStorage.getItem('firebase_token'),authSuccess);
    },

    addOrder : function(data,callback){
      // We add default information , for the status of the order

      data.deliveryStatus = 'open'
      fbObj.child('orders').child(data.code).set(data,callback);
    }
  }

})();


fb.init();