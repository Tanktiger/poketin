angular.module('poketin.controllers', [])

.controller('DashCtrl', function($scope
                                , $log
                                , $rootScope
                                , $ionicModal
                                , $ionicSlideBoxDelegate
                                , $ionicActionSheet
                                , $ionicPopup
                                , TDCardDelegate
                                , $timeout
                                , $interval
                                , $ionicLoading
                                 , $ionicPlatform
                                 , $cordovaGeolocation
                                 , userService
                                 , userFactory
                                 , $cordovaCamera
                                 , $state
                                 , $cordovaToast

) {

  $scope.like = like;
  $scope.likeOnProfile = likeOnProfile;
  $scope.info = info;
  $scope.slideHasChanged = slideHasChanged;
  $scope.showProfile = showProfile;
  $scope.showEditProfile = showEditProfile;
  $scope.showSettings = showSettings;
  $scope.showActionSheet = showActionSheet;
  $scope.slideTo = slideTo;
  $scope.deleteProfile = deleteProfile;
  $scope.addPhoto = addPhoto;
  $scope.deletePhoto = deletePhoto;
  $scope.startChat = startChat;
  $scope.checkIfAlreadyMatched = checkIfAlreadyMatched;
  $scope.logout = logout;
  $scope.getChatOverviewDetails = getChatOverviewDetails;

  $scope.deviceHeight  = window.innerHeight;
  $scope.user = userService.getUser();
  $scope.myToggle = true;
  $scope.trainers = {};
  $scope.chats = {};
  var cardTypes = [];

  $scope.slideIndex = 0;

  // $scope.showConfirm = function() {
  //  var confirmPopup = $ionicPopup.confirm({
  //    title: 'Consume Ice Cream',
  //    // template: 'Are you sure you want to eat this ice cream?',
  //    templateUrl:'templates/popups/select-countries.html',
  //    cssClass: 'animated bounceInUp dark-popup',
  //    okType: 'button-small button-dark bold',
  //    okText: 'Save',
  //    cancelType: 'button-small'
  //  });
  //
  //  confirmPopup.then(function(res) {
  //    if(res) {
  //      console.log('You are sure');
  //    } else {
  //      console.log('You are not sure');
  //    }
  //  });
  // };

  // $scope.showConfirm();

  function slideTo(index){
    $ionicSlideBoxDelegate.slide(index);
  }

  $scope.$watch(function(scope) { return scope.slideIndex },
    function(newValue, oldValue) {
      switch(newValue) {
        case 0:
        case 2:
          $ionicSlideBoxDelegate.enableSlide(false);
          break;
      }
    }
  );
  $scope.$on('$ionicView.enter', function(e) {
    getNewCards();
    getTrainers();
    getChats();
  });


  var updateUserPositionTimer = $interval(function () {
    // userService.updateUserPosition();

  }, 60000);

  $scope.$on('$ionicView.leave', function() {
    console.log('leaving UserMessages view, destroying interval');
    // Make sure that the interval is destroyed
    if (angular.isDefined(updateUserPositionTimer)) {
      $interval.cancel(updateUserPositionTimer);
      updateUserPositionTimer = undefined;
    }
  });

  $scope.cards = {
    master: cardTypes,
    active: cardTypes,
    discards: [],
    liked: [],
    disliked: [],
    visible: null
  };

  $scope.cardDestroyed = function(index) {
    $scope.cards.active.splice(index, 1);
  };

  $scope.addCard = function() {
    // var newCard = cardTypes[0];
    // $scope.cards.active.push(angular.extend({}, newCard));
  };

  $scope.refreshCards = function() {
    getNewCards();
  };

  $scope.$on('removeCard', function(event, element, card) {
    var discarded = $scope.cards.master.splice($scope.cards.master.indexOf(card), 1);
    $scope.cards.discards.push(discarded);
    firebase.database().ref('users-likes/' + $scope.user.uid + '/' + card.uid).update({
      'date': date.getTime(),
      'like': false,
      'dislike': false,
      'discard': true
    });
  });

  $scope.cardSwipedLeft = function(index) {
    console.log('LEFT SWIPE');
    saveDislike(index);
  };

  $scope.cardSwipedRight = function(index) {
    console.log('RIGHT SWIPE');
    saveLike(index);
  };

  function getNewCards() {
    $ionicLoading.show({
      template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
    });

    var posOptions = {timeout: 10000, enableHighAccuracy: false};
    $ionicPlatform.ready(function() {
      $cordovaGeolocation
        .getCurrentPosition(posOptions)
        .then(function (position) {
          var date = new Date();

          if (position) {
            var lowLat, highLat, lowLong, highLong;
            var point = new LatLon(position.coords.latitude, position.coords.longitude);
            var points = {};
            points.north = point.destinationPoint(100000, 0); //100km
            points.east = point.destinationPoint(100000, 90);//100km
            points.south = point.destinationPoint(100000, 180);//100km
            points.west = point.destinationPoint(100000, 270); //100km
            lowLat = point.lat;
            highLat = point.lat;
            lowLong = point.long;
            highLong = point.long;
            angular.forEach(points, function (point, dir) {
                if (lowLat > point.lat ) lowLat = point.lat;
                if (highLat < point.lat ) highLat = point.lat;
                if (lowLong > point.long ) lowLat = point.long;
                if (highLong < point.long ) lowLat = point.long;
            });
            console.info(position.coords, lowLat, highLat, lowLong, highLong);
            //left = 270 degrees
            //top = 0 degrees
            //bottom = 180 degrees
            //right = 90 degrees
            // var longStart = position.coords.longitude - 0.5;
            // var longEnd = position.coords.longitude + 0.5;
            // var latStart = position.coords.latitude - 0.5;
            // var latEnd = position.coords.latitude + 0.5;

            // console.info(position, longStart, longEnd, latStart, latEnd);
            $scope.cards.master = [];

            //@TODO: check if we need lastLong or if we put both variables in one
            firebase.database().ref('users')
              .orderByChild('lastLat')
              .startAt(lowLat).endAt(highLat)
              .once('value', function(snapshot) {
                if (snapshot.exists()) {
                  // dont set if discard, like or dislike
                  firebase.database().ref('users-likes/' + $scope.user.uid).once('value').then(function (data) {
                    if (data.exists()) {
                      snapshot.forEach(function (childsnapshot) {
                        var add = true;

                        if (childsnapshot.key !== $scope.user.uid) {
                          data.forEach(function (likeChildsnapshot) {
                            //if user is in firebase we liked, disliked or discarded him
                            if (childsnapshot.key == likeChildsnapshot.key) {
                              add = false;
                            }
                          });

                          if (add && !cardTypes[childsnapshot.key]) {
                            var user = childsnapshot.val();
                            cardTypes[childsnapshot.key] = user;
                            $scope.cards.master.push(user);
                          }
                        }

                      });
                    } else {
                      snapshot.forEach(function (childsnapshot) {
                        if (childsnapshot.key !== $scope.user.uid && !cardTypes[childsnapshot.key]) {
                          cardTypes[childsnapshot.key] = childsnapshot.val();
                          $scope.cards.master.push(childsnapshot.val());
                        }
                      });
                    }
                    $ionicLoading.hide();
                    refreshCards();
                  }, function () {
                    //error
                    $ionicLoading.hide();
                  });
                } else {
                  //no user found - @TODO: show toast
                  $ionicLoading.hide();
                }
              }, function () {
                //error
                $ionicLoading.hide();
              });

            firebase.database().ref('users')
              .orderByChild('lastLong')
              .startAt(lowLong).endAt(highLong)
              .once('value', function(snapshot) {
                if (snapshot.exists()) {
                  // dont set if discard, like or dislike
                  firebase.database().ref('users-likes/' + $scope.user.uid).once('value').then(function (data) {
                    if (data.exists()) {
                      snapshot.forEach(function (childsnapshot) {
                        var add = true;

                        if (childsnapshot.key !== $scope.user.uid) {
                          data.forEach(function (likeChildsnapshot) {
                            //if user is in firebase we liked, disliked or discarded him
                            if (childsnapshot.key == likeChildsnapshot.key) {
                              add = false;
                            }
                          });

                          if (add && !cardTypes[childsnapshot.key]) {
                            var user = childsnapshot.val();
                            cardTypes[childsnapshot.key] = user;
                            $scope.cards.master.push(user);
                          }
                        }

                      });
                    } else {
                      snapshot.forEach(function (childsnapshot) {
                        if (childsnapshot.key !== $scope.user.uid && !cardTypes[childsnapshot.key]) {
                          cardTypes[childsnapshot.key] = childsnapshot.val();
                          $scope.cards.master.push(childsnapshot.val());
                        }

                      });
                    }

                    $ionicLoading.hide();
                    refreshCards();

                  }, function () {
                    //error
                    $ionicLoading.hide();
                  });
                } else {
                  //no user found - @TODO: show toast
                  $ionicLoading.hide();
                }
              }, function () {
                //error
                $ionicLoading.hide();
              });
          } else {
            //@TODO: show popup that we cant find the position
            $ionicLoading.hide();
          }

        }, function (err) {
          // error
          $ionicLoading.hide();
        });
    });
  }

  function like(liked){
    if (!liked) {
      TDCardDelegate.$getByHandle('cards').getFirstCard().swipe('left');
    } else {
      TDCardDelegate.$getByHandle('cards').getFirstCard().swipe('right');
    }
  }

  function likeOnProfile(liked){
    if (!liked) {
      saveDislike(0);
    } else {
      saveLike(0);
    }
  }

  function saveDislike(index) {
    var card = $scope.cards.active[index];
    $scope.cards.disliked.push(card);
    var date = new Date();
    firebase.database().ref('users-likes/' + $scope.user.uid + '/' + card.uid).update({
      'date': date.getTime(),
      'like': false,
      'dislike': true,
      'discard': false
    });
  }

  function saveLike(index) {
    var card = $scope.cards.active[index];
    $scope.cards.liked.push(card);

    var date = new Date();
    //set user as liked for us
    firebase.database().ref('users-likes/' + $scope.user.uid + '/' + card.uid).update({
      'date': date.getTime(),
      'like': true,
      'dislike': false,
      'discard': false
    });

    checkForMatch(card);
  }

  function refreshCards() {
    // Set $scope.cards to null so that directive reloads
    $scope.cards.active = null;
    //@todo: add real functions
    $timeout(function() {
      $scope.cards.active = Array.prototype.slice.call($scope.cards.master, 0);
      $scope.cards.visible = $scope.cards.active[0];
    });
  }

  function info(){
    $log.info('info popup');
  }

  $scope.onTouch = function(){
    $ionicSlideBoxDelegate.enableSlide(false);
    console.log('touched');
  };

  $scope.onRelease = function(){
    $ionicSlideBoxDelegate.enableSlide(true);
    console.log('released');
  };

  function slideHasChanged(index){
    console.log('slideHasChanged');
    $scope.slideIndex = index
  }

  function showProfile(uid) {
    $ionicLoading.show({
      template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
    });
    userFactory.getUserByUid(uid).then(function (snapshot) {
      $ionicLoading.hide();

      if (snapshot && snapshot.val()) {
        $ionicModal.fromTemplateUrl('templates/modals/profile.html', {
          scope: $scope,
          animation: 'animated _zoomOut',
          hideDelay:920
        }).then(function(modal) {
          $scope.modalProfile = modal;
          $scope.otherUser = snapshot.val();
          $scope.modalProfile.show();
          $scope.hideProfile = function(){
            $scope.modalProfile.hide();
          }
        });
      }
    });
  }

  function checkForMatch(otherUser) {
    $ionicLoading.show({
      template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
    });

    //check if other user liked us
    firebase.database().ref('users-likes/' + otherUser.uid + '/' + $scope.user.uid).once('value').then(function (data) {
      $ionicLoading.hide();
      console.log(data);
      if (data.exists()) {
        itsAMatch(otherUser);
      }
    });

  }

  function itsAMatch(otherUser) {
    //save match
    var date = new Date();
    var userData = {
      'date': date.getTime(),
      'uid': $scope.user.uid,
      'nickname': $scope.user.nickname,
      'photoURL': $scope.user.photoURL
    };
    var otherUserData = {
      'date': date.getTime(),
      'uid': otherUser.uid,
      'nickname': otherUser.nickname,
      'photoURL': otherUser.photoURL
    };


    var updates = {};
    //save our match
    updates['users-matches/' + $scope.user.uid + '/' + otherUser.uid] = otherUserData;
    //save other user match
    updates['users-matches/' + otherUser.uid + '/' + $scope.user.uid] = userData;

    //update all with one call
    firebase.database().ref().update(updates);

    $ionicModal.fromTemplateUrl('templates/modals/match.html', {
      scope: $scope,
      animation: 'animated _fadeOut',
      hideDelay:920
    }).then(function(modal) {

      $scope.otherUser = otherUser;
      $scope.modalMatch = modal;
      $scope.modalMatch.show();
      $scope.hideMatch = function(){
        $scope.modalMatch.hide();
      }
    });
  }

  function showActionSheet() {

      // Show the action sheet
      var hideSheet = $ionicActionSheet.show({
       buttons: [
         { text: 'Unmatch Ben' }
       ],
       cancelText: '<span class="color-white">Cancel</span>',
       cssClass: 'tinder-actionsheet',
       cancel: function() {
            // add cancel code..
          },
       buttonClicked: function(index) {
         return true;
       }
     });
  }

  function showEditProfile() {
    $ionicModal.fromTemplateUrl('templates/modals/edit-profile.html', {
      scope: $scope,
      animation: 'slide-in-up',
      hideDelay:920
    }).then(function(modal) {
      $scope.modalSettings = modal;
      $scope.modalSettings.show();

      $scope.hideSettings = function(){
        $scope.modalSettings.hide();
      };

      $scope.saveProfile = function () {
        userService.updateUser($scope.user);
      }
    });
  }

  function showSettings() {
    $ionicModal.fromTemplateUrl('templates/modals/settings.html', {
      scope: $scope,
      animation: 'slide-in-up',
      hideDelay:920
    }).then(function(modal) {
      $scope.modalSettings = modal;
      $scope.modalSettings.show();
      $scope.hideSettings = function(){
        $scope.modalSettings.hide();
      }
    });
  }

  function deleteProfile() {
    $ionicActionSheet.show({
      buttons: [
        { text: 'Delete my account' }
      ],
      cancelText: '<span class="color-white">Cancel</span>',
      cssClass: 'tinder-actionsheet',
      cancel: function() {
        // add cancel code..
      },
      buttonClicked: function(index) {
        userService.removeUser();
        $state.go("login");
        $cordovaToast.show("Profile deleted", "long", "bottom");
        return true;
      }
    });
  }

  function getTrainers() {
    firebase.database().ref('users-matches/' + $scope.user.uid).on('child_changed', function (data) {
      $scope.trainers[data.key] = data.val();

    });

    firebase.database().ref('users-matches/' + $scope.user.uid).on('child_added', function (data) {
      $scope.trainers[data.key] = data.val();
    });

    firebase.database().ref('users-matches/' + $scope.user.uid).on('child_removed', function (data) {
      delete $scope.trainers[data.key];
    });
  }

  function getChats(){
    //add private chats
    firebase.database().ref('users-chats/' + $scope.user.uid).on('child_changed', function (data) {
      console.log('chat child_changed');

      if ($scope.chats.length > 0) {
        if (!checkIfChatIsAlreadyRendered(data.key)) {
          addChatByID(data.key);
        }
      } else {
        //add at the beginning
        addChatByID(data.key);
      }

    });

    firebase.database().ref('users-chats/' + $scope.user.uid).on('child_added', function (data) {
      console.log('users-chats child_added');
      console.log(data.val());
      var chatInfo = data.val();
      chatInfo.cid = data.key;
      //add at the beginning
      if (!checkIfChatIsAlreadyRendered(data.key)) {
        addChatByID(data.key);
      }
    });

    // firebase.database().ref('users-chats/' + $scope.user.uid).on('child_removed', function (data) {
    //   console.log('chat child_removed');
    //   console.log(data.val());
    //   //add at the beginning
    //   $scope.chats.unshift(data.val());
    // });
  }

  function checkIfChatIsAlreadyRendered(chatId) {
    if ($scope.chats.length > 0) {

      if (document.getElementById(chatId)) return true;

      var alreadyRendered = false;

      if ($scope.chats && $scope.chats[chatId] && $scope.chats[chatId].length > 0) {
        alreadyRendered = true;
      }

      return alreadyRendered;

    } else {
      return false;
    }
  }

  function addChatByID(chatID) {
    firebase.database().ref('chats/' + chatID).once('value', function (data) {
      console.log(data.val());
      //add at the beginning
      getChatOverviewDetails(data.val())
    });
  }

  function startChat() {
    $ionicModal.fromTemplateUrl('templates/modals/select-trainer.html', {
      scope: $scope,
      animation: 'slide-in-up',
      hideDelay:920
    }).then(function(modal) {
      $scope.modalSettings = modal;
      $scope.modalSettings.show();

      $scope.hideSettings = function(){
        $scope.modalSettings.hide();
      };

      $scope.chooseUser = function (otherUser) {
        $ionicLoading.show({
          template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
        });

        //@TODO check if there is already a chat in scope.chats - if no we can create one - else we open the existing chat
        var chatAlreadyExists = false;
        angular.forEach($scope.chats, function (chat, chatId) {
            if (chat.user.uid == otherUser.uid) {
              $scope.modalSettings.hide();
              $ionicLoading.hide();
              $state.go('tab.chat-detail', {'chatId': chatId});
              chatAlreadyExists = true;
              return false;
            }
        });

        //if chat does not already exists - create a new one
        if (!chatAlreadyExists) {
          var date = new Date();
          var userData = {
            'date': date.getTime(),
            'uid': $scope.user.uid,
            'nickname': $scope.user.nickname,
            'photoURL': $scope.user.photoURL
          };
          var otherUserData = {
            'date': date.getTime(),
            'uid': otherUser.uid,
            'nickname': otherUser.nickname,
            'photoURL': otherUser.photoURL
          };

          //get new chat id
          var newChatId = firebase.database().ref().child('chats').push().key;
          var chatData = {
            'cid': newChatId,
            'messages': [],
            'private': true,
            'users': [
              otherUser.uid, $scope.user.uid
            ]
          };
          var updates = {};

          //save chat
          updates['chats/' + newChatId] = chatData;
          //create our chat
          updates['users-chats/' + $scope.user.uid + '/' + newChatId] = otherUserData;
          //create other user chat
          updates['users-chats/' + otherUser.uid + '/' + newChatId] = userData;

          //update all with one call
          firebase.database().ref().update(updates).then(function () {
            $scope.modalSettings.hide();
            $ionicLoading.hide();
            $state.go('tab.chat-detail', {'chatId': newChatId});
            $cordovaToast.show("Started new chat", "short", "bottom");
          });
        }

      }
    });

  }

  function addPhoto() {
    var options = {
      quality : 75,
      destinationType : Camera.DestinationType.DATA_URL,
      sourceType : Camera.PictureSourceType.CAMERA,
      allowEdit : true,
      encodingType: Camera.EncodingType.JPEG,
      popoverOptions: CameraPopoverOptions,
      targetWidth: 400,
      targetHeight: 400,
      saveToPhotoAlbum: false
    };
    $cordovaCamera.getPicture(options).then(function(imageData) {
      $scope.user.photoURL = "data:image/jpeg;base64," + imageData;
      userService.changeAvatar($scope.user.photoURL);
    }, function(error) {
      //@TODO error handling
      console.error(error);
    });
  }

  function deletePhoto() {
    $scope.user.photoURL = 'img/profile_placeholder.png';
    userService.changeAvatar('img/profile_placeholder.png');
    $cordovaToast.show("Picture deleted", "short", "bottom");
  }

  function checkIfAlreadyMatched(otherUserUid) {
    angular.forEach($scope.trainers, function (trainer) {
      if (trainer.uid == otherUserUid) {
        return true;
      }
    });

    return false;
  }

  function logout() {
    userService.logout();
    $state.go("login");
    $cordovaToast.show("Successfully logout", "short", "bottom");
  }

  function getChatOverviewDetails(chat) {
    var chatOverviewDetails = {};
    chatOverviewDetails.cid = chat.cid;
    chatOverviewDetails.user = {};
    chatOverviewDetails.lastMessage = '';
    var lastUserId = null;

    if (chat.messages && Object.keys(chat.messages).length > 0) {
      var lastMessage = chat.messages[Object.keys(chat.messages)[Object.keys(chat.messages).length - 1]];
      chatOverviewDetails.lastMessage = lastMessage.text;
      if (lastMessage.uid !== $scope.user.uid) {
        lastUserId = lastMessage.uid;
      }
    }

    if (!lastUserId) {
      angular.forEach(chat.users, function (uid) {
        if (uid !== $scope.user.uid) {
          lastUserId = uid;
        }
      });
    }

    userFactory.getUserByUid(lastUserId).then(function (snapshot) {
      if (snapshot && snapshot.val()) {
        chatOverviewDetails.user = snapshot.val();
        $scope.chats[chat.cid] = chatOverviewDetails;
        // $scope.chats.unshift(chatOverviewDetails);
        console.log($scope.chats);
      }
    });
  }
})

.controller('ChatDetailCtrl', ['$scope', '$rootScope', '$state',
  '$stateParams', '$ionicActionSheet', 'userService', 'Chats', '$ionicLoading', '$cordovaClipboard',
  '$ionicPopup', '$ionicScrollDelegate', '$timeout', '$interval', 'SessionStorageService',
  function($scope, $rootScope, $state, $stateParams,
    $ionicActionSheet, userService, Chats, $ionicLoading, $cordovaClipboard,
    $ionicPopup, $ionicScrollDelegate, $timeout, $interval, SessionStorageService) {

    $scope.user = userService.getUser();
    $scope.toUser = null;
    $scope.input = null;
    $scope.messages = (SessionStorageService.get($stateParams.chatId))?SessionStorageService.get($stateParams.chatId): {};


    var messagesRef = firebase.database().ref('chats/' + $stateParams.chatId + '/messages');
    var intialMessagesLoaded = false;
    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    var footerBar; // gets set in $ionicView.enter
    var scroller;

    $ionicLoading.show({
      template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
    });

    listeningForMessages();

    //get other user
    firebase.database().ref('users-chats/' + $scope.user.uid + '/' + $stateParams.chatId).once('value').then(function (snapshot) {
      var userChatData = snapshot.val();

      // viewScroll.scrollBottom(true);

      $scope.input = {
        message: localStorage['userMessage-' + userChatData.uid] || ''
      };

      firebase.database().ref('users/' + userChatData.uid).once('value').then(function (snapshot) {
        $scope.toUser = snapshot.val();
        $ionicLoading.hide();
      });
    });

    messagesRef.limitToLast(50).once("value", function (snapshot) {
      intialMessagesLoaded = true;
      snapshot.forEach(function (childdata) {
        displayMessage(childdata);
      });
      $timeout(function() {
          viewScroll.scrollBottom(true);
        }, 200)
    });

    $scope.$watch('input.message', function(newValue, oldValue) {
      if (!newValue) newValue = '';
      if ($scope.toUser) {
        localStorage['userMessage-' + $scope.toUser.uid] = newValue;
      }
    });

    $scope.$on('$ionicView.enter', function() {
      console.log('UserMessages $ionicView.enter');
    });

    $scope.$on('$ionicView.leave', function() {
      console.log('leaving UserMessages view, destroying interval');
    });

    $scope.$on('$ionicView.beforeLeave', function() {
      if (!$scope.input.message || $scope.input.message === '') {
        localStorage.removeItem('userMessage-' + $scope.toUser.uid);
      }
    });

    $scope.sendMessage = function(sendMessageForm) {
      $ionicLoading.show({
        template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
      });
      var date = new Date();
      var message = {
        uid: $scope.user.uid,
        text: $scope.input.message,
        date: date.getTime()
      };
      Chats.addMessage($stateParams.chatId, message).then(function (res) {
        message.mid = res.key;
        // if you do a web service call this will be needed as well as before the viewScroll calls
        // you can't see the effect of this in the browser it needs to be used on a real device
        // for some reason the one time blur event is not firing in the browser but does on devices
        keepKeyboardOpen();

        $scope.input.message = '';
        // $scope.messages.push(message);
        $timeout(function() {
          $ionicLoading.hide();
          keepKeyboardOpen();
          // viewScroll.scrollBottom(true);
        }, 200);
      });
    };

    // this keeps the keyboard open on a device only after sending a message, it is non obtrusive
    function keepKeyboardOpen() {
    }

    $scope.onMessageHold = function(e, itemIndex, message) {
      console.log('onMessageHold');
      console.log('message: ' + JSON.stringify(message, null, 2));
      $ionicActionSheet.show({
        buttons: [{
          text: 'Copy Text'
        }, {
          text: 'Delete Message'
        }],
        buttonClicked: function(index) {
          switch (index) {
            case 0: // Copy Text
              $cordovaClipboard.copy(message.text);
              break;
            case 1: // Delete
              // no server side secrets here :~)
              //@TODO
              delete $scope.messages[message.mid];
              firebase.database().ref('chats/' + $stateParams.chatId + '/messages/'+message.mid).remove();
              $timeout(function() {
                viewScroll.resize();
              }, 0);

              break;
          }

          return true;
        }
      });
    };

    // this prob seems weird here but I have reasons for this in my app, secret!
    $scope.viewProfile = function(msg) {
      if (msg.userId === $scope.user._id) {
        // go to your profile
      } else {
        // go to other users profile
      }
    };

    // I emit this event from the monospaced.elastic directive, read line 480
    $scope.$on('taResize', function(e, ta) {
      if (!ta) return;

      var taHeight = ta[0].offsetHeight;

      if (!footerBar) return;

      var newFooterHeight = taHeight + 10;
      newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;

      footerBar.style.height = newFooterHeight + 'px';
      scroller.style.bottom = newFooterHeight + 'px';
    });

    $scope.scrollResize = function () {
      $timeout(function() {
        keepKeyboardOpen();
        viewScroll.resize();
        // viewScroll.scrollBottom(true);
      }, 200);
    };

    $scope.scrollToBottom = function () {
      $timeout(function() {
        keepKeyboardOpen();
        viewScroll.scrollBottom(true);
      }, 200);
    };
    $scope.hideChat = function () {
      $state.go("tab.dash");
    };

    function listeningForMessages() {
      messagesRef.limitToLast(100).on('child_added', function (snapshot) {
        if (intialMessagesLoaded) {
          console.log(snapshot.val());
          displayMessage(snapshot);
          $timeout(function() {
            viewScroll.scrollBottom(true);
          }, 200);
        }
      });
      messagesRef.limitToLast(300).on('child_removed', function (snapshot) {
        delete $scope.messages[snapshot.key];
        $timeout(function() {
          if(!$scope.$$phase) {
            $scope.$apply(function () {
            });
          }
          viewScroll.resize();
          viewScroll.scrollBottom(true);
        }, 0);
      });
    }

    function displayMessage(snapshot) {
      if (!document.getElementById(snapshot.key)) {
        var message = snapshot.val();
        message.mid = snapshot.key;
        $scope.messages[snapshot.key] = message;

        SessionStorageService.set($stateParams.chatId, message, message.mid);

        if(!$scope.$$phase) {
          $scope.$apply(function () {
            // $timeout(function() {
            //   viewScroll.scrollBottom(true);
            // }, 200);
          });
        }
      }
    }
}])


// Following are untouched
.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})


.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})

.controller('LoginCtrl', function($scope, $timeout, $stateParams, ionicMaterialInk, $cordovaToast, $state, userService, $ionicLoading, $ionicPlatform, $ionicHistory) {
    $scope.hideNavBar = true;
    $scope.hideMenuButton = true;
    $scope.loginWithGoogle = function loginWithGoogle() {
      // var googleProvider = new firebase.auth.GoogleAuthProvider();
      // login(googleProvider);
      hello('google').login(function (r) {
        console.log(r);
      });
    };

  //https://firebase.google.com/docs/auth/web/facebook-login
  $scope.loginWithFacebook = function loginWithFacebook() {
    console.log('loginWithFacebook');
    hello('facebook').login(function (r) {
      console.log(r);
    });
    // $cordovaFacebook.login(["public_profile", "email", "user_friends"])
    //   .then(function(success) {
    //     var credential = firebase.auth.FacebookAuthProvider.credential(success.token);
    //     login(credential);
    //   }, function (error) {
    //     // error
    //   });
  };
  hello.on("auth.login", function (r) {
    console.log(r);

    if (r.authResponse && r.authResponse.access_token) {
      if (r.network && r.network == 'facebook') {
        login(firebase.auth.FacebookAuthProvider.credential(r.authResponse.access_token));
      } else {
        //https://developers.google.com/identity/protocols/googlescopes
        // var provider = new firebase.auth.GoogleAuthProvider();
        // provider.addScope("https://www.googleapis.com/auth/userinfo.email");
        // provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
        // login(provider.credential(r.authResponse.access_token));
        login(firebase.auth.GoogleAuthProvider.credential(null, r.authResponse.access_token));
      }
    }
  });
  function login(credential) {
    $ionicLoading.show({
      template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
    });
    firebase.auth().signInWithCredential(credential).then(function (result) {
      console.log(result);
      // This gives you a Google Access Token. You can use it to access the Google API.
      // var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user; //firebase user - can we get everytime with firebase.auth().currentUser

      //@TODO: set moment js locale
      // amMoment.changeLocale('de');
      //@TODO: set angular translate locale

      userService.checkAccountData().then(function (result) {
        //clear history so back button will not bring us back
        $ionicHistory.clearHistory();
        $ionicLoading.hide();

        if (result) {
          $ionicPlatform.ready(function() {
            $state.go("tab.dash");
          });
        } else {
          $state.go("profilecomplete");
        }
      });

      // ...
    }).catch(function (error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      // ...
      console.error(errorCode + ' : ' + errorMessage + ' - ' + credential);
      $ionicLoading.hide();
      $cordovaToast.show("An error occured", "long", "bottom");
    });

    ionicMaterialInk.displayEffect();
  }
  })

.controller('ProfileCompleteCtrl', function($scope, $state, $stateParams, $timeout, $cordovaGeolocation, $ionicPlatform, $ionicHistory, ionicMaterialMotion, ionicMaterialInk, userService, $ionicLoading) {

  // Set Header
    $scope.user = userService.getUser();
    $scope.user.language = 'en';
    // Set Motion
    $timeout(function() {
      ionicMaterialMotion.slideUp({
        selector: '.slide-up'
      });
    }, 300);

    $timeout(function() {
      ionicMaterialMotion.fadeSlideInRight({
        startVelocity: 3000
      });
    }, 700);

    // Set Ink
    ionicMaterialInk.displayEffect();

    $scope.saveUser = function() {
      $ionicLoading.show({
        template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
      });

      //@TODO: check if user with nickname is already registered

      var currentUser = firebase.auth().currentUser;
      var posOptions = {timeout: 10000, enableHighAccuracy: false};
      $ionicPlatform.ready(function() {
          $cordovaGeolocation
            .getCurrentPosition(posOptions)
            .then(function (position) {
              var lat = position.coords.latitude;
              var long = position.coords.longitude;
              var date = new Date();
              if (!currentUser.photoURL || currentUser.photoURL == '') currentUser.photoURL = 'img/profile_placeholder.png';
              firebase.database().ref('users/' + currentUser.uid).set({
                uid: ($scope.user.uid)?$scope.user.uid:currentUser.uid,
                nickname: ($scope.user.nickname)?$scope.user.nickname:'',
                email: ($scope.user.email)?$scope.user.email:currentUser.email,
                displayName: ($scope.user.displayName)?$scope.user.displayName:currentUser.displayName,
                team: ($scope.user.team)?$scope.user.team:'',
                language: ($scope.user.language)?$scope.user.language:'en',
                photoURL: ($scope.user.photoURL)?$scope.user.photoURL:currentUser.photoURL,
                registerDate:  ($scope.user.registerDate)?$scope.user.registerDate:date.getTime(),
                updateDate: date.getTime(),
                registerCoords: {
                  lat: ($scope.user.registerCoords && $scope.user.registerCoords.lat)?$scope.user.registerCoords.lat:lat,
                  long: ($scope.user.registerCoords && $scope.user.registerCoords.long)?$scope.user.registerCoords.long:long
                },
                updateCoords: {
                  lat: lat,
                  long: long
                },
                settings: {
                  showOnlineStatus: true
                },
                lastLat: lat,
                lastLong: long,
                lastActive: date.getTime()
              }).then(function () {
                $ionicLoading.hide();
                $state.go("tab.dash");
              });

            }, function (err) {
              // error
            });
        });
    }

  })

;

