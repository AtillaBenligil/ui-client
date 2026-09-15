'use strict';

/**
 * @ngdoc function
 * @name irpsimApp.controller:LoginCtrl
 * @description
 * Steuert die Anmeldemaske.
 *
 * Die Fehlermeldung unterscheidet bewusst nicht zwischen unbekanntem Benutzer
 * und falschem Passwort, da auch das Backend diese Faelle nicht unterscheidet.
 */
angular.module('irpsimApp')
  .controller('LoginCtrl', function ($scope, $state, AuthService) {

    $scope.credentials = {username: '', password: ''};
    $scope.error = null;
    $scope.busy = false;

    /**
     * Meldet den Benutzer an und wechselt bei Erfolg auf die Startseite.
     */
    $scope.login = function () {
      $scope.error = null;
      $scope.busy = true;

      AuthService.login($scope.credentials.username, $scope.credentials.password)
        .then(function () {
          $state.go('/');
        })
        .catch(function (response) {
          $scope.error = response && response.status === 401
            ? 'Benutzername oder Passwort ist falsch.'
            : 'Das Verzeichnis ist zurzeit nicht erreichbar.';
        })
        .finally(function () {
          $scope.busy = false;
          $scope.credentials.password = '';
        });
    };
  });
