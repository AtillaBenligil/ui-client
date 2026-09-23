'use strict';

/**
 * @ngdoc service
 * @name irpsimApp.authInterceptor
 * @description
 * Ergaenzt jede Anfrage an das Backend um das Zugriffstoken.
 *
 * Der Abfangjaeger folgt dem Aufbau des bereits vorhandenen
 * growlInterceptorWithoutErrors. Beantwortet das Backend eine Anfrage mit dem
 * Status 401, ist die Sitzung abgelaufen; die lokalen Anmeldedaten werden dann
 * verworfen und die Anmeldemaske aufgerufen.
 *
 * AuthService und $state werden ueber den $injector nachgeladen, da eine
 * unmittelbare Injektion zu einem Abhaengigkeitszyklus mit $http fuehren
 * wuerde.
 */
angular.module('irpsimApp')
  .factory('authInterceptor', function ($q, $injector) {

    var LOGIN_STATE = 'login';
    var AUTH_PATH = '/backend/simulation/auth/';

    /**
     * Prueft, ob eine Anfrage an das Backend gerichtet ist.
     *
     * Anfragen an Vorlagen und statische Dateien erhalten kein Token.
     */
    function isBackendRequest(url) {
      return angular.isString(url) && url.indexOf('/backend/') === 0;
    }

    return {
      request: function (config) {
        if (isBackendRequest(config.url)) {
          var token = $injector.get('AuthService').getToken();
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = 'Bearer ' + token;
          }
        }
        return config;
      },

      responseError: function (rejection) {
        var url = rejection && rejection.config ? rejection.config.url : '';
        var isLoginAttempt = angular.isString(url) && url.indexOf(AUTH_PATH) === 0;

        if (rejection && rejection.status === 401 && !isLoginAttempt) {
          $injector.get('AuthService').discard();
          $injector.get('$state').go(LOGIN_STATE);
        }
        // Das Backend antwortet mit 403, wenn Lese- oder Schreibrecht fehlen.
        // Der Freigabedialog und die Gruppenverwaltung zeigen eigene Meldungen.
        var handledLocally = angular.isString(url) &&
          (url.indexOf('/backend/simulation/access/') === 0 || url.indexOf('/backend/simulation/groups') === 0);
        if (rejection && rejection.status === 403 && !handledLocally) {
          $injector.get('growl').error('Für diese Aktion fehlt die Berechtigung.');
        }
        return $q.reject(rejection);
      }
    };
  });
