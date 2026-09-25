'use strict';

/**
 * @ngdoc function
 * @name irpsimApp.controller:AccessDialogCtrl
 * @description
 * Steuert den Freigabedialog einer Ressource.
 *
 * Der Dialog zeigt, wer die Ressource lesen oder veraendern darf, und erlaubt
 * es, Benutzern oder Gruppen Rechte einzuraeumen oder zu entziehen. Das Backend
 * verhindert, dass das letzte Schreibrecht entfaellt; dessen Meldung wird im
 * Dialog angezeigt.
 */
angular.module('irpsimApp')
  .controller('AccessDialogCtrl', function ($scope, $uibModalInstance, AccessService, resource) {

    $scope.resource = resource;
    $scope.entries = [];
    $scope.groups = [];
    $scope.error = null;
    $scope.busy = false;
    $scope.newEntry = {subjectType: 'USER', subjectName: '', permission: 'READ'};

    function showError(response) {
      if (response && response.status === 403) {
        $scope.error = 'Nur Benutzer mit Schreibrecht an dieser Ressource können die Freigaben verwalten.';
      } else if (response && response.data && response.data.error) {
        $scope.error = response.data.error;
      } else {
        $scope.error = 'Die Freigaben konnten nicht geändert werden.';
      }
    }

    function load() {
      $scope.busy = true;
      AccessService.getPermissions(resource.type, resource.id)
        .then(function (entries) {
          $scope.entries = entries;
        })
        .catch(showError)
        .finally(function () {
          $scope.busy = false;
        });
    }

    /**
     * Raeumt das eingegebene Recht ein oder aendert ein bestehendes.
     */
    $scope.add = function () {
      var name = ($scope.newEntry.subjectName || '').trim();
      if (!name) {
        return;
      }
      $scope.error = null;
      AccessService.setPermission(resource.type, resource.id, $scope.newEntry.subjectType, name, $scope.newEntry.permission)
        .then(function (entries) {
          $scope.entries = entries;
          $scope.newEntry.subjectName = '';
        })
        .catch(showError);
    };

    /**
     * Aendert das Recht eines bestehenden Eintrags zwischen Lesen und Schreiben.
     */
    $scope.change = function (entry) {
      $scope.error = null;
      AccessService.setPermission(resource.type, resource.id, entry.subjectType, entry.subjectName, entry.permission)
        .then(function (entries) {
          $scope.entries = entries;
        })
        .catch(function (response) {
          showError(response);
          load();
        });
    };

    $scope.remove = function (entry) {
      $scope.error = null;
      AccessService.revokePermission(resource.type, resource.id, entry.subjectType, entry.subjectName)
        .then(load)
        .catch(showError);
    };

    $scope.close = function () {
      $uibModalInstance.close();
    };

    // Die Gruppennamen werden als Vorschlaege angeboten; Benutzernamen lassen
    // sich nicht aus dem Verzeichnis auflisten und werden frei eingegeben.
    AccessService.getGroups().then(function (groups) {
      $scope.groups = groups.map(function (group) {
        return group.name;
      });
    });

    load();
  });
