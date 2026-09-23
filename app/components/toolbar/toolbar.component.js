(function () {
  'use strict';

  /* @ngInject */
  function ToolbarController(toolbarServices, AuthService, $state, $scope) {
    var vm = this;
    vm.modelName = 'IRPopt';

    // Die Leiste wird nur einmal beim Start erzeugt, meist noch vor der
    // Anmeldung. Benutzer, Gruppen und die Modelle, die das Backend erst nach
    // der Anmeldung liefert, werden daher bei jeder An- und Abmeldung neu
    // geladen.
    function refresh() {
      vm.username = AuthService.getUsername();
      vm.groups = AuthService.getGroups();
      vm.isAdministrator = AuthService.isAdministrator();
      if (AuthService.isAuthenticated()) {
        toolbarServices.getModelDefinitions().then(function (modelDefinitions) {
          vm.modelDefinitions = modelDefinitions;
        });
      } else {
        vm.modelDefinitions = [];
      }
    }

    vm.$onInit = function () {
      refresh();
      $scope.$on(AuthService.CHANGED_EVENT, refresh);
    };

    vm.setModelName = function (model) {
      vm.modelName = model.name;
    };

    // Der angemeldete Benutzer und seine Gruppen werden in der Leiste
    // angezeigt, damit im Betrieb erkennbar ist, unter welcher Kennung
    // gearbeitet wird.
    vm.logout = function () {
      AuthService.logout().then(function () {
        $state.go('login');
      });
    };

  }

  angular
    .module('irpsimApp.toolbar')
    .component('appToolbar', {
      templateUrl: 'components/toolbar/toolbar.html',
      controller: ToolbarController
    });
})
();

