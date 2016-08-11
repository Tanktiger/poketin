angular.module('poketin.directives', [])
.directive('noScroll', function($document) {

  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {

      $document.on('touchmove', function(e) {
        console.log('no scroll')
        e.preventDefault();
      });
    }
  }
})
.filter("fromTimestamp", function(){
  return function(timestamp, format){
    return moment.unix(timestamp).format(format)
  }
})

.directive("repeatEnd", function(){
  return {
    restrict: "A",
    link: function (scope, element, attrs) {
      if (scope.$last) {
        scope.$eval(attrs.repeatEnd);
      }
    }
  };
})
;

Array.prototype.insert = function(index) {
    this.splice.apply(this, [index, 0].concat(
        Array.prototype.slice.call(arguments, 1)));
    return this;
};
