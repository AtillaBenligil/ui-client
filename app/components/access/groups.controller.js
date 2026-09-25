'use strict';

/**
 * @ngdoc function
 * @name irpsimApp.controller:GroupsCtrl
 * @description
 * Verwaltung der Benutzergruppen.
 *
 * Gruppen anlegen, loeschen und Mitglieder aendern duerfen nur
 * Administratoren; das Backend weist alle anderen mit 403 ab. Die Seite ist
 * daher nur fuer Administratoren in der Werkzeugleiste verlinkt.
 */
angular.module('irpsimApp')
  .controller('GroupsCtrl', function ($scope, AccessService) {

    $scope.groups = [];
    $scope.newGroup = {name: '', description: ''};
    $scope.newMember = {};
    $scope.error = null;

    function showError(response) {
      if (response && response.status === 403) {
        $scope.error = 'Nur Administratoren dürfen Gruppen verwalten.';
      } else if (response && response.data && response.data.error) {
        $scope.error = response.data.error;
      } else {
        $scope.error = 'Die Gruppen konnten nicht geändert werden.';
      }
    }

    function load() {
      AccessService.getGroups()
        .then(function (groups) {
          $scope.groups = groups;
        })
        .catch(showError);
    }

    $scope.createGroup = function () {
      $scope.error = null;
      AccessService.createGroup($scope.newGroup.name.trim(), $scope.newGroup.description)
        .then(function () {
          $scope.newGroup = {name: '', description: ''};
          load();
        })
        .catch(showError);
    };

    $scope.deleteGroup = function (group) {
      $scope.error = null;
      AccessService.deleteGroup(group.name).then(load).catch(showError);
    };

    $scope.addMember = function (group) {
      var username = ($scope.newMember[group.name] || '').trim();
      if (!username) {
        return;
      }
      $scope.error = null;
      AccessService.addMember(group.name, username)
        .then(function () {
          $scope.newMember[group.name] = '';
          load();
        })
        .catch(showError);
    };

    $scope.removeMember = function (group, username) {
      $scope.error = null;
      AccessService.removeMember(group.name, username).then(load).catch(showError);
    };

    load();
  });
