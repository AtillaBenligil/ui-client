'use strict';

/**
 * @ngdoc service
 * @name irpsimApp.AuthService
 * @description
 * Verwaltet die Anmeldung am Backend.
 *
 * Der Dienst haelt das Zugriffstoken, das das Backend nach erfolgreicher
 * Anmeldung am LDAP-Verzeichnis ausstellt. Das Passwort selbst wird nicht
 * gespeichert; es wird ausschliesslich zum Zeitpunkt der Anmeldung
 * beziehungsweise der Passwortaenderung uebertragen.
 *
 * Das Token liegt im sessionStorage und nicht im localStorage, damit es beim
 * Schliessen des Browserfensters verfaellt.
 */
angular.module('irpsimApp')
  .factory('AuthService', function ($http, $q, $window, $rootScope) {

    var BASE_URL = '/backend/simulation/auth';
    var TOKEN_KEY = 'irpsim.auth.token';
    var USER_KEY = 'irpsim.auth.user';
    var GROUPS_KEY = 'irpsim.auth.groups';
    var ADMIN_GROUP = 'irpsim-admins';

    /**
     * Ereignis, das bei jeder An- oder Abmeldung gesendet wird. Die
     * Werkzeugleiste liegt ausserhalb der Ansichten und wird nur einmal beim
     * Start der Anwendung erzeugt; sie aktualisiert sich ueber dieses Ereignis.
     */
    var CHANGED_EVENT = 'irpsim.auth.changed';

    /**
     * Liest einen Wert aus dem sessionStorage.
     *
     * Der Zugriff wird abgesichert, da der sessionStorage in manchen
     * Browsereinstellungen nicht verfuegbar ist.
     */
    function read(key) {
      try {
        return $window.sessionStorage.getItem(key);
      } catch (e) {
        return null;
      }
    }

    function notify() {
      $rootScope.$broadcast(CHANGED_EVENT);
    }

    function write(key, value) {
      try {
        if (value === null || value === undefined) {
          $window.sessionStorage.removeItem(key);
        } else {
          $window.sessionStorage.setItem(key, value);
        }
      } catch (e) {
        // Ohne sessionStorage bleibt die Anmeldung auf die laufende Seite beschraenkt.
      }
    }

    var service = {};

    /**
     * Meldet einen Benutzer am Backend an.
     *
     * @param {string} username Der Anmeldename
     * @param {string} password Das Passwort
     * @returns {Promise} Der angemeldete Benutzer
     */
    service.login = function (username, password) {
      return $http.post(BASE_URL + '/login', {username: username, password: password})
        .then(function (response) {
          write(TOKEN_KEY, response.data.token);
          write(USER_KEY, response.data.username);
          write(GROUPS_KEY, angular.toJson(response.data.groups || []));
          notify();
          return response.data;
        });
    };

    /**
     * Meldet den Benutzer ab.
     *
     * Die lokalen Daten werden auch dann verworfen, wenn das Backend nicht
     * erreichbar ist, damit die Oberflaeche nicht in einem angemeldeten
     * Zustand haengen bleibt.
     *
     * @returns {Promise} Wird aufgeloest, sobald die Abmeldung abgeschlossen ist
     */
    service.logout = function () {
      function forget() {
        write(TOKEN_KEY, null);
        write(USER_KEY, null);
        write(GROUPS_KEY, null);
        notify();
      }

      if (!service.isAuthenticated()) {
        forget();
        return $q.when();
      }

      return $http.post(BASE_URL + '/logout').then(forget, forget);
    };

    /**
     * Aendert das Passwort des angemeldeten Benutzers im Verzeichnis.
     *
     * Nach einer erfolgreichen Aenderung beendet das Backend alle Sitzungen des
     * Benutzers, daher werden auch lokal die Anmeldedaten verworfen.
     *
     * @param {string} oldPassword Das bisherige Passwort
     * @param {string} newPassword Das neue Passwort
     * @returns {Promise} Wird aufgeloest, sobald das Passwort geaendert wurde
     */
    service.changePassword = function (oldPassword, newPassword) {
      return $http.post(BASE_URL + '/password', {oldPassword: oldPassword, newPassword: newPassword})
        .then(function () {
          write(TOKEN_KEY, null);
          write(USER_KEY, null);
          write(GROUPS_KEY, null);
          notify();
        });
    };

    /**
     * @returns {string} Das Zugriffstoken der laufenden Sitzung
     */
    service.getToken = function () {
      return read(TOKEN_KEY);
    };

    /**
     * @returns {string} Der Anmeldename des angemeldeten Benutzers
     */
    service.getUsername = function () {
      return read(USER_KEY);
    };

    /**
     * @returns {Array} Die Gruppen des angemeldeten Benutzers
     */
    service.getGroups = function () {
      var raw = read(GROUPS_KEY);
      return raw ? angular.fromJson(raw) : [];
    };

    /**
     * Prueft, ob der Benutzer laut Verzeichnis Administrator ist.
     *
     * Dient nur dazu, Verwaltungsfunktionen ein- oder auszublenden; die
     * eigentliche Pruefung erfolgt im Backend.
     *
     * @returns {boolean} true, falls der Benutzer der Administratorgruppe angehoert
     */
    service.isAdministrator = function () {
      return service.getGroups().indexOf(ADMIN_GROUP) >= 0;
    };

    /**
     * @returns {boolean} true, falls eine Sitzung besteht
     */
    service.isAuthenticated = function () {
      var token = read(TOKEN_KEY);
      return token !== null && token !== '';
    };

    /**
     * Verwirft die lokalen Anmeldedaten, ohne das Backend aufzurufen.
     *
     * Wird verwendet, wenn das Backend eine Anfrage mit 401 beantwortet und das
     * Token damit ohnehin nicht mehr gueltig ist.
     */
    service.discard = function () {
      write(TOKEN_KEY, null);
      write(USER_KEY, null);
      write(GROUPS_KEY, null);
      notify();
    };

    service.CHANGED_EVENT = CHANGED_EVENT;

    return service;
  });
