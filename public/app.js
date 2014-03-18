
var ngApp = angular.module('phonecatApp', []);

ngApp.controller('StatesController', ['$scope', '$http', function ($scope, $http) {
    $scope.stateClicked = function(state) {
        console.log(state);
        $http.post('/api/applyState', {_id: state._id})
            .success (function(data, status, headers, config) {
                console.log('SUCCESS: ' + data + '--' + status);
            });
    };
    $http({method: 'GET', url: '/api/commands'}).
        success(function(data, status, headers, config) {
            $scope.states = data;
        }).
        error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
}]);
