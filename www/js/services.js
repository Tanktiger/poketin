angular.module('poketin.services', [])

.factory('Chats', function(userService, $firebaseArray) {
  var chats = [];

  firebase.database().ref('users-chats/' + userService.getUser().uid).on('child_added', function(snapshot) {
    chats.unshift(snapshot.val());
  });
  firebase.database().ref('users-chats/' + userService.getUser().uid).on('child_changed', function(snapshot) {
    chats.push(snapshot.val());
    var add = true;

    angular.forEach(chats, function (chat, key) {
      if (chat.cid == snapshot.key) {
        add = false;
      }
    });

    if (add) {
      //add at the beginning
      chats.unshift(data.val());
    }
  });

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
      firebase.database().ref('chats/' + chat.cid).remove();
      //@TODO: remove chat from users-chats
    },
    get: function(chatId) {
      return firebase.database().ref('chats/' + chatId).once('value');
    },
    getMessages: function (chatId) {
      var messagesRef = firebase.database().ref('chats/' + chatId + '/messages');
      return $firebaseArray(messagesRef);
    },
    addMessage: function (chatId, message) {
      return firebase.database().ref('chats/' + chatId + '/messages').push(message);
    }
  };
})


  .service('userService', function ($ionicPlatform, $cordovaGeolocation, $ionicLoading, $cordovaToast, hello) {
    var service = this;
    service.user = null;


    service.setUser = function (user) {
      if (user.uid) {
        service.user = user;
      }
    };

    service.getUser = function () {
      return (service.user)? service.user: firebase.auth().currentUser;
    };

    service.checkAccountData = function () {
      return firebase.database().ref('users/' + firebase.auth().currentUser.uid).once('value').then(function(snapshot) {
        var data = snapshot.val();
        service.user = data;

        if (data !== null && data !== undefined) {
          if (!data.nickname || data.nickname == '') return false;
          if (!data.email || data.email == '') return false;
          if (!data.displayName || data.displayName == '') return false;
          if (!data.team || data.team == '') return false;
          if (!data.language || data.language == '') return false;
          if (!data.photoURL || data.photoURL == '') return false;

          return true;
        } else {
          if (!data) {
            service.user = firebase.auth().currentUser;
          }
          return false;
        }

      });
    };

    service.updateUserPosition = function () {
      var date = new Date();
      var posOptions = {timeout: 10000, enableHighAccuracy: false};
      $ionicPlatform.ready(function() {
        $cordovaGeolocation
          .getCurrentPosition(posOptions)
          .then(function (position) {
            service.user.lastLat = position.coords.latitude;
            service.user.lastLong = position.coords.longitude;
            service.user.lastActive = date.getTime();

            var uid = null;
            if (service.user && service.user.uid) {
              uid = service.user.uid;
            } else {
              uid = firebase.auth().currentUser.uid;
            }

            firebase.database().ref('users/' + uid).update({
              lastLat: service.user.lastLat,
              lastLong: service.user.lastLong,
              lastActive: service.user.lastActive
            }).then(function () {

            });
          });
      });
    };

    service.updateUser = function (data) {
      $ionicLoading.show({
        template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
      });
      firebase.database().ref('users/' + service.user.uid).update(data).then(function () {
        angular.extend(service.user, data);
        $ionicLoading.hide();
        $cordovaToast.show("Profile updated", "short", "bottom");
      });

    };

    service.removeUser = function (data) {
      $ionicLoading.show({
        template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
      });
      firebase.database().ref('users/' + service.user.uid).remove().then(function () {
        service.user = null;
        $ionicLoading.hide();
      });

    };

    service.changeAvatar = function (photoUrl) {
      firebase.database().ref('users/' + service.user.uid).update({photoURL: photoUrl}).then(function() {
        service.user.photoURL = photoUrl;
        $cordovaToast.show("Picture changed", "short", "bottom");
      });
    };

    service.logout = function () {
      service.user = null;
      firebase.auth().signOut();
      hello.logout();
      window.localStorage.removeItem('hello'); //remove by hand because hello.logout does nothing :(
    }
  })

  .factory('userFactory', function ($ionicPlatform) {
    var service = this;

    service.getUserByUid = function (uid) {
      return firebase.database().ref('users/' + uid).once('value');
    };

    return service;
  })


.factory('SessionStorageService', function ($window) {
  var service = {};

  service.get = get;
  service.set = set;
  service.remove = remove;
  service.isAvailable = isAvailable;
  return service;

  function get(key, subkey) {
    if (isAvailable()) {
      if (subkey !== undefined && subkey !== '') {
        if ($window.localStorage[key] && $window.sessionStorage[key][subkey] && $window.sessionStorage[key][subkey] !== 'undefined') {
          var parent = JSON.parse($window.sessionStorage[key]);
          return parent[subkey];
        }
      } else {
        if ($window.sessionStorage[key] && $window.sessionStorage[key] !== 'undefined') {
          return JSON.parse($window.sessionStorage[key]);
        }
      }
    } else {
      if (subkey !== undefined && subkey !== '') {
        if ($window.localStorage[key] && $window.localStorage[key][subkey] && $window.localStorage[key][subkey] !== 'undefined') {
          var parent = JSON.parse($window.localStorage[key]);
          return parent[subkey];
        }
      } else {
        if ($window.localStorage[key] && $window.localStorage[key] !== 'undefined') {
          return JSON.parse($window.localStorage[key]);
        }
      }

    }
    return null;
  }

  function set(key, data, subkey) {
    if (isAvailable()) {
      if (subkey !== undefined && subkey !== '') {
        var values = get(key);
        if (!values) {
          $window.sessionStorage[key] = '';
          values = {};
        }
        values[subkey] = data;
        $window.sessionStorage[key] = JSON.stringify(values);
      } else {
        $window.sessionStorage[key] = JSON.stringify(data);
      }
    } else {
      if (subkey !== undefined && subkey !== '') {
        var values = get(key);
        if (!values) {
          $window.localStorage[key] = '';
          values = {};
        }
        values[subkey] = data;
        $window.localStorage[key] = JSON.stringify(values);
      } else {
        $window.localStorage[key] = JSON.stringify(data);
      }
    }
  }

  function remove(key) {
    if (isAvailable()) {
      $window.sessionStorage[key] = null;
    } else {
      $window.localStorage[key] = null;
    }
  }

  function isAvailable() {
    try {
      $window.sessionStorage.world = 'hello';
      delete $window.sessionStorage.world;
      return true;
    } catch (ex) {
      return false;
    }
  }

})

;
