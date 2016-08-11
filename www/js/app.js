// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('poketin', ['ionic',
                          , 'poketin.controllers'
                          , 'poketin.services'
                          , 'poketin.directives'
                          , 'monospaced.elastic'
                          , 'ksSwiper'
                          , 'ionTinderCards',
                          'ionic-material',
                          'firebase',
                          'ngCordova',
                          'angularMoment',
                            'ngHello'
              ])

.run(function($ionicPlatform,  $rootScope) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    if(window.plugins && window.plugins.AdMob) {
      var admob_key = device.platform == "Android" ?
        "ca-app-pub-6877983798700739/8079893604" : "ca-app-pub-6877983798700739/7940292805";
      var admob = window.plugins.AdMob;
      admob.createBannerView(
        {
          'publisherId': admob_key,
          'adSize': admob.AD_SIZE.BANNER,
          'bannerAtTop': false
        },
        function() {
          admob.requestAd(
            { 'isTesting': false },
            function() {
              admob.showAd(true);
            },
            function() { console.log('failed to request ad'); }
          );
        },
        function() { console.log('failed to create banner view'); }
      );
    }

  });
})

.config(function ($provide, $ionicConfigProvider, $compileProvider, helloProvider) {
  $ionicConfigProvider.tabs.position('bottom');
  // $translateProvider.useStaticFilesLoader({
  //     prefix: 'l10n/',
  //     suffix: '.json'
  //   });
  // $translateProvider.preferredLanguage("en");
  // $translateProvider.fallbackLanguage("en");
  $ionicConfigProvider.scrolling.jsScrolling(false);
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|cdvfile|file|filesystem|blob):|data:image\//);
  $ionicConfigProvider.backButton.text(null).icon('ion-arrow-left-c color-coral');

  helloProvider.init({
    facebook: '1766534716958090',
    google: '400281548240-l9av3hfr502818ptg35tsce8i9f8e9dg.apps.googleusercontent.com'
  }, {
    // redirect_uri: 'https://poketinder-5fa5b.firebaseapp.com/__/auth/handler',
    // redirect_uri: 'index.html',
    redirect_uri: 'http://localhost:8100/login',
    scope: 'email'
  });
})


.config(function($stateProvider, $urlRouterProvider) {


  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl'
    })

    .state('profilecomplete', {
      url: '/profilecomplete',
      templateUrl: 'templates/profileComplete.html',
      controller: 'ProfileCompleteCtrl'
    })

  // setup an abstract state for the tabs directive
    .state('tab', {
      url: '/tab',
      abstract: true,
      templateUrl: 'templates/tabs.html'
    })

  // Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'DashCtrl'
      }
    }
  })
  .state('tab.dash-match', {
    url: '/dash/:matchId',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash-match.html',
        controller: 'MatchCtrl'
      }
    }
  })

  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'ChatsCtrl'
        }
      }
    })
    .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
      // resolve: {
      //   chat: function (Chats, $stateParams) {
      //     return Chats.get($stateParams.chatId);
      //   }
      // }
    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  })

  ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
