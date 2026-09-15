'use strict';

/**
 * @ngdoc function
 * @name irpsimApp.controller:PasswordChangeCtrl
 * @description
 * Steuert die Maske zur Passwortaenderung.
 *
 * Das Backend beendet nach einer erfolgreichen Aenderung alle Sitzungen des
 * Benutzers. Die Maske fuehrt deshalb anschliessend zurueck zur Anmeldung.
 */
angular.module('irpsimApp')
  .controller('PasswordChangeCtrl', function ($scope, $state, growl, AuthService) {

    $scope.passwords = {oldPassword: '', newPassword: '', repeatedPassword: ''};
    $scope.error = null;
    $scope.busy = false;

    /**
     * Prueft, ob das neue Passwort zweimal gleich eingegeben wurde.
     */
    $scope.passwordsMatch = function () {
      return $scope.passwords.newPassword === $scope.passwords.repeatedPassword;
    };

    /**
     * Aendert das Passwort im Verzeichnis.
     */
    $scope.changePassword = function () {
      if (!$scope.passwordsMatch()) {
        $scope.error = 'Die beiden neuen Passwörter stimmen nicht überein.';
        return;
      }

      $scope.error = null;
      $scope.busy = true;

      AuthService.changePassword($scope.passwords.oldPassword, $scope.passwords.newPassword)
        .then(function () {
          growl.success('Das Passwort wurde geändert. Bitte melden Sie sich erneut an.');
          $state.go('login');
        })
        .catch(function (response) {
          $scope.error = response && response.status === 401
            ? 'Das bisherige Passwort ist falsch.'
            : 'Das Passwort konnte nicht geändert werden.';
        })
        .finally(function () {
          $scope.busy = false;
          $scope.passwords.oldPassword = '';
          $scope.passwords.newPassword = '';
          $scope.passwords.repeatedPassword = '';
        });
    };
  });
