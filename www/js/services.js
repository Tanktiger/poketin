angular.module('poketin.services', [])

  .factory('Chats', function(userService, $firebaseArray, $localStorage) {
    var chats = [];

    firebase.database().ref('users-chats/' + userService.getUser().uid).on('child_added', function(snapshot) {
      chats.unshift(snapshot.val());
      $localStorage.chats[snapshot.key] = snapshot.val();
    });

    firebase.database().ref('users-chats/' + userService.getUser().uid).on('child_changed', function(snapshot) {
      // chats.push(snapshot.val());
      // var add = true;

      angular.forEach(chats, function (chat, key) {
        if (chat.cid == snapshot.key) {
          chats[key] = snapshot.val();
          $localStorage.chats[snapshot.key] = snapshot.val();
          // add = false;
        }
      });

      // if (add) {
      //   //add at the beginning
      //   chats.unshift(data.val());
      // }
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


  .service('userService', function ($ionicPlatform, $cordovaGeolocation, $ionicLoading, $cordovaToast, hello, $translate) {
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

      service.refreshUser = function () {
        return firebase.database().ref('users/' + firebase.auth().currentUser.uid)
          .once('value')
          .then(function(snapshot) {
            var data = snapshot.val();
            service.user = data;
            return data;
        });
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
          $translate.use(service.user.language);
          $cordovaToast.show($translate.instant("toasts.user.update"), "short", "bottom");
        });

      };

      service.removeUser = function (data) {
        $ionicLoading.show({
          template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
        });
        firebase.database().ref('users/' + service.user.uid).remove().then(function () {
          service.user = null;
          $cordovaToast.show($translate.instant("toasts.user.delete"), "long", "bottom");
          $ionicLoading.hide();
        });

      };

      service.changeAvatar = function (photoUrl) {
        firebase.database().ref('users/' + service.user.uid).update({photoURL: photoUrl}).then(function() {
          service.user.photoURL = photoUrl;
          $cordovaToast.show($translate.instant("toasts.user.picture_changed"), "short", "bottom");
        });
      };

      service.logout = function () {
        service.user = null;
        firebase.auth().signOut();
        hello.logout();
        window.localStorage.removeItem('hello'); //remove by hand because hello.logout does nothing :(
      }
    })

  .factory('userFactory', function () {
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

  .factory('pokemonFactory', function ($http) {
    var service = this;
    var pokemon = {};

    $http.get('locale/pokemon.'+userService.getUser().language+'.json')
      .then(function(res){
        pokemon = res.data;
      });

    service.get = function (id) {
      return pokemon[id];
    };

    service.getAll = function () {
      return pokemon;
    };

    return service;
  })

  .service('tradeService', function ($ionicLoading, $cordovaToast, $translate, userService, $localStorage) {
    var service = this;
    service.trades = [];
    service.ownTrades = [];
    service.search = {
      "pokemon": null,
      "cp": 0,
      "distance": 300
    };

    //load the trading items - first from storage and then from firebase
    init();

    service.setTrade = function (trade) {
      if (trade.id) {
        if (checkIfTradePassSearch(trade)) {
          service.trades[trade.id] = trade;
        }
        $localStorage.trades[trade.id] = trade;
      }
      return this;
    };

    service.getTrade = function (id) {
      return (service.trades && service.trades.length > 0 && id && service.trades[id])? service.trades[id]: null;
    };

    service.getTrades = function () {
      return service.trades;
    };

    service.setOwnTrade = function (trade) {
      if (trade.id) {
        service.ownTrades[trade.id] = trade;
        $localStorage.ownTrades[trade.id] = trade;
      }
      return this;
    };

    service.getOwnTrade = function (id) {
      return (service.ownTrades && service.ownTrades.length > 0 && id && service.ownTrades[id])? service.ownTrades[id]: null;
    };

    service.getOwnTrades = function () {
      return service.ownTrades;
    };

    service.setTrades = function (trades) {
      service.trades = trades;
      $localStorage.trades = trades;
      return this;
    };

    service.updateTrade = function (trade) {
      $ionicLoading.show({
        template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
      });
      firebase.database().ref('trades/' + trade.id).update(trade).then(function () {
        service.setTrade(trade);
        $ionicLoading.hide();
        $cordovaToast.show($translate.instant("toasts.trade.update"), "short", "bottom");
      });

    };

    service.removeTrade = function (id) {
      $ionicLoading.show({
        template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
      });
      firebase.database().ref('trades/' + id).remove().then(function () {
        if (service.trades[id] && service.trades[id].length > 0) {
          delete service.trades[id];
          delete $localStorage.trades[id];
        }
        if (service.ownTrades[id] && service.ownTrades[id].length > 0) {
          delete service.ownTrades[id];
          delete $localStorage.ownTrades[id];
        }

        $cordovaToast.show($translate.instant("toasts.trade.delete"), "long", "bottom");
        $ionicLoading.hide();
      });

    };

    service.newTrade = function(trade) {
      //@todo return promise um an anderen Stellen darauf warten zu können
      $ionicLoading.show({
        template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
      });

      var date = new Date();
      var user = userService.getUser();

      //get new chat id
      var newTradeId = firebase.database().ref().child('trades').push().key;
      trade.id = newTradeId;
      //@TODO: firebase server time
      trade.date = date.getTime();
      trade.creator = user.uid;
      trade.lat = user.lastLat;
      trade.long = user.lastLong;

      var updates = {};

      //save trade
      updates['trades/' + newTradeId] = trade;

      //update all with one call
      firebase.database().ref().update(updates).then(function () {
        $ionicLoading.hide();
        $cordovaToast.show($translate.instant("toasts.trade.new"), "short", "bottom");
      });
    };

    service.startSearch = function () {
      //@todo return promise um an anderen Stellen darauf warten zu können
      //erst im localstorage suchen und dann auf firebase
      service.trades = filterTrades($localStorage.trades);
      getTradingItems();
    };

    function init() {
      loadFromStorage();
      getOwnTradingItems();
      getTradingItems();
    }

    function getTradingItems () {
      var tradesRef = firebase.database().ref('trades');
      //first remove oldListener - childs must be removed extra
      tradesRef.off('child_added');
      tradesRef.off('child_changed');
      tradesRef.off('child_removed');
      tradesRef.orderByChild('lat').off('child_added');
      tradesRef.orderByChild('long').off('child_added');
      tradesRef.orderByChild('lat').off('child_changed');
      tradesRef.orderByChild('long').off('child_changed');

      var points = calculateLowAndHighPoints();

      tradesRef.orderByChild('lat')
        .startAt(points.lowLat).endAt(points.highLat).on('child_added', function (data) {
        service.setTrade(data.val());
      });
      tradesRef.orderByChild('long')
        .startAt(points.lowLong).endAt(points.highLong).on('child_added', function (data) {
        service.setTrade(data.val());
      });

      tradesRef.orderByChild('lat')
        .startAt(points.lowLat).endAt(points.highLat).on('child_changed', function (data) {
        service.setTrade(data.val());
      });
      tradesRef.orderByChild('long')
        .startAt(points.lowLong).endAt(points.highLong).on('child_changed', function (data) {
        service.setTrade(data.val());
      });

      // tradesRef.on('child_changed', function (data) {
      //   service.setTrade(data.val());
      // });

      tradesRef.on('child_removed', function (data) {
        service.removeTrade(data.key);
      });
    }

    function getOwnTradingItems () {
      if (firebase.auth() && firebase.auth().currentUser) {
        firebase.database().ref('trades').orderByChild("author").equalTo(firebase.auth().currentUser.uid).on('child_added', function (trade) {
          service.setOwnTrade(trade.val());
        });

        firebase.database().ref('trades').orderByChild("author").equalTo(firebase.auth().currentUser.uid).on('child_changed', function (trade) {
          service.setOwnTrade(trade.val());
        });
      }
    }

    function loadFromStorage() {
      service.trades = filterTrades($localStorage.trades);
      service.ownTrades = $localStorage.ownTrades;
    }

    function filterTrades(trades) {
      //@TODO: promise?
      var result = [];
      angular.forEach(trades, function (trade, key) {
        if (checkIfTradePassSearch(trade)) {
          result.push(trade);
        }
      });

      return result;
    }

    function checkIfTradePassSearch(trade) {
      //@TODO: promise?
      var points = calculateLowAndHighPoints();
      var add = false;

      //distance check
      if (trade.lat >= points.lowLat && trade.lat <= points.highLat) {
        add = true;
      }
      if (trade.long >= points.lowLong && trade.long <= points.highLong) {
        add = true;
      }

      //pokemon check
      if (service.search.pokemon) {
        add = (service.search.pokemon == trade.pokemon);
      }

      //cp check
      if (service.search.cp != 0) {
        add = (service.search.cp <= trade.cp);
      }

      return add;
    }

    function calculateLowAndHighPoints() {
      //@TODO: berechnung in factory auslagern
      var user = userService.getUser();
      var lowLat, highLat, lowLong, highLong;
      var point = new LatLon(user.lastLat, user.lastLong);
      var points = {};

      points.north = point.destinationPoint(service.search.distance, 0); //100km
      points.east = point.destinationPoint(service.search.distance, 90);//100km
      points.south = point.destinationPoint(service.search.distance, 180);//100km
      points.west = point.destinationPoint(service.search.distance, 270); //100km

      lowLat = point.lat;
      highLat = point.lat;
      lowLong = point.lon;
      highLong = point.lon;

      angular.forEach(points, function (point, dir) {
        if (lowLat > point.lat ) lowLat = point.lat;
        if (highLat < point.lat ) highLat = point.lat;
        if (lowLong > point.lon ) lowLong = point.lon;
        if (highLong < point.lon ) highLong = point.lon;
      });


      if (lowLat == undefined) {
        lowLat = position.coords.latitude - 0.5;
      }
      if (highLat == undefined) {
        highLat = position.coords.latitude + 0.5;
      }
      if (lowLong == undefined) {
        lowLong = position.coords.longitude - 0.5;
      }
      if (highLong == undefined) {
        highLong = position.coords.longitude + 0.5;
      }

      return {
        lowLat: lowLat,
        highLat: highLat,
        lowLong: lowLong,
        highLong: highLong
      }
    }
  })

;//end of services
