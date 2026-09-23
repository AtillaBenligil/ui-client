'use strict';

/**
 * @ngdoc service
 * @name irpsimApp.AccessService
 * @description
 * Zugriff auf die Rechteverwaltung des Backends.
 *
 * Kapselt die Freigabe von Szenarien, Simulationsauftraegen und Stammdaten an
 * Benutzer und Gruppen sowie die Verwaltung der Benutzergruppen. Die
 * Entscheidung, ob eine Aktion erlaubt ist, trifft ausschliesslich das Backend;
 * die Oberflaeche zeigt dessen Antwort nur an.
 */
angular.module('irpsimApp')
  .factory('AccessService', function ($http) {

    var ACCESS_URL = '/backend/simulation/access/';
    var GROUPS_URL = '/backend/simulation/groups';

    function data(response) {
      return response.data;
    }

    var service = {};

    /**
     * @param {string} type SCENARIO, JOB oder STAMMDATUM
     * @param {number} id Die Kennung der Ressource
     * @returns {Promise} Die Rechteeintraege der Ressource
     */
    service.getPermissions = function (type, id) {
      return $http.get(ACCESS_URL + type + '/' + id).then(data);
    };

    /**
     * Setzt das Recht eines Benutzers oder einer Gruppe; ein bestehendes Recht
     * desselben Subjekts wird ersetzt.
     *
     * @returns {Promise} Die Rechteeintraege nach der Aenderung
     */
    service.setPermission = function (type, id, subjectType, subjectName, permission) {
      return $http.put(ACCESS_URL + type + '/' + id,
        {subjectType: subjectType, subjectName: subjectName, permission: permission}).then(data);
    };

    /**
     * Entzieht einem Benutzer oder einer Gruppe das Recht an einer Ressource.
     */
    service.revokePermission = function (type, id, subjectType, subjectName) {
      return $http.delete(ACCESS_URL + type + '/' + id + '/' + subjectType + '/' + encodeURIComponent(subjectName));
    };

    /** @returns {Promise} Alle Benutzergruppen mit ihren Mitgliedern */
    service.getGroups = function () {
      return $http.get(GROUPS_URL).then(data);
    };

    service.createGroup = function (name, description) {
      return $http.put(GROUPS_URL, {name: name, description: description}).then(data);
    };

    service.deleteGroup = function (name) {
      return $http.delete(GROUPS_URL + '/' + encodeURIComponent(name));
    };

    service.addMember = function (group, username) {
      return $http.post(GROUPS_URL + '/' + encodeURIComponent(group) + '/members/' + encodeURIComponent(username)).then(data);
    };

    service.removeMember = function (group, username) {
      return $http.delete(GROUPS_URL + '/' + encodeURIComponent(group) + '/members/' + encodeURIComponent(username)).then(data);
    };

    return service;
  })

  /**
   * @ngdoc service
   * @name irpsimApp.AccessDialog
   * @description
   * Oeffnet den Freigabedialog fuer eine Ressource. Tabellen fuer Szenarien,
   * Simulationsauftraege und Stammdaten rufen nur {@code open} auf.
   */
  .factory('AccessDialog', function ($uibModal) {
    return {
      open: function (type, id, label) {
        return $uibModal.open({
          templateUrl: 'components/access/access-dialog.html',
          controller: 'AccessDialogCtrl',
          resolve: {
            resource: function () {
              return {type: type, id: id, label: label};
            }
          }
        }).result.catch(angular.noop);
      }
    };
  });
