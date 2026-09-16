(function () {
  'use strict';

  /* @ngInject */
  function ToolbarController(toolbarServices, AuthService, $state) {
    var vm = this;
    vm.modelName = 'IRPopt';

    vm.$onInit = function () {
      toolbarServices.getModelDefinitions().then(function (modelDefinitions) {
        vm.modelDefinitions = modelDefinitions;
      });
      vm.username = AuthService.getUsername();
      vm.groups = AuthService.getGroups();
    };

    vm.setModelName = function (model) {
      vm.modelName = model.name;
    };

    // Der angemeldete Benutzer und seine Gruppen werden in der Leiste
    // angezeigt, damit im Betrieb erkennbar ist, unter welcher Kennung
    // gearbeitet wird.
    vm.logout = function () {
      AuthService.logout().then(function () {
        vm.username = null;
        vm.groups = [];
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

