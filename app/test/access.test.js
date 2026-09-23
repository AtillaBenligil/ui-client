/*
    Tests der Rechteverwaltung in der Oberflaeche: Freigabedialog,
    Gruppenverwaltung, Administratorerkennung und die Meldung bei fehlender
    Berechtigung. Das Backend wird ueber $httpBackend nachgebildet; ob eine
    Aktion tatsaechlich erlaubt ist, entscheidet ausschliesslich das Backend und
    wird dort getestet.
 */
describe('Rechteverwaltung', function () {
  beforeEach(module('irpsimApp'));

  var $httpBackend, $rootScope, $controller;

  beforeEach(inject(function (_$httpBackend_, _$rootScope_, _$controller_) {
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    // Vorlagen, die ui-router beim Start laedt, sind fuer diese Tests ohne Belang.
    $httpBackend.whenGET(/\.html$/).respond(200, '');
    // Stammdaten-Zwischenspeicher aus ui-common, der beim Start geladen wird.
    $httpBackend.whenGET('/backend/simulation/szenariosets').respond(200, []);
    $httpBackend.whenGET('/backend/simulation/stammdaten?all=true').respond(200, []);
    $httpBackend.whenGET('/backend/simulation/datensatz').respond(200, {});
  }));

  afterEach(function () {
    // Offene Anfragen werden nicht geprueft: ohne Sitzung laedt ui-router beim
    // Start die Anmeldemaske, die fuer diese Tests ohne Belang ist.
    $httpBackend.verifyNoOutstandingExpectation();
    window.sessionStorage.clear();
  });

  describe('AccessService', function () {
    var AccessService;

    beforeEach(inject(function (_AccessService_) {
      AccessService = _AccessService_;
    }));

    it('sendet eine Freigabe mit Subjekt und Recht an das Backend', function () {
      $httpBackend.expectPUT('/backend/simulation/access/STAMMDATUM/7',
        {subjectType: 'GROUP', subjectName: 'projekt-nord', permission: 'READ'})
        .respond(200, [{subjectType: 'GROUP', subjectName: 'projekt-nord', permission: 'READ'}]);

      var result;
      AccessService.setPermission('STAMMDATUM', 7, 'GROUP', 'projekt-nord', 'READ').then(function (entries) {
        result = entries;
      });
      $httpBackend.flush();

      expect(result.length).toBe(1);
    });

    it('kodiert Namen beim Entziehen eines Rechts', function () {
      $httpBackend.expectDELETE('/backend/simulation/access/SCENARIO/3/GROUP/team%20a').respond(204, ''); // wie der Browser: leerer Rumpf statt undefined

      AccessService.revokePermission('SCENARIO', 3, 'GROUP', 'team a');
      $httpBackend.flush();
    });
  });

  describe('AccessDialogCtrl', function () {
    var $scope, modalInstance;

    beforeEach(function () {
      $scope = $rootScope.$new();
      modalInstance = jasmine.createSpyObj('$uibModalInstance', ['close']);
      $httpBackend.whenGET('/backend/simulation/groups').respond(200, [{name: 'projekt-nord', members: []}]);
      $httpBackend.expectGET('/backend/simulation/access/JOB/5')
        .respond(200, [{subjectType: 'USER', subjectName: 'bob', permission: 'WRITE'}]);
      $controller('AccessDialogCtrl', {
        $scope: $scope,
        $uibModalInstance: modalInstance,
        resource: {type: 'JOB', id: 5, label: 'Simulation 5'}
      });
      $httpBackend.flush();
    });

    it('zeigt die bestehenden Freigaben und die Gruppennamen', function () {
      expect($scope.entries.length).toBe(1);
      expect($scope.groups).toEqual(['projekt-nord']);
    });

    it('gibt die Ressource frei und leert das Eingabefeld', function () {
      $httpBackend.expectPUT('/backend/simulation/access/JOB/5',
        {subjectType: 'USER', subjectName: 'carol', permission: 'READ'})
        .respond(200, [{}, {}]);

      $scope.newEntry.subjectName = '  carol ';
      $scope.add();
      $httpBackend.flush();

      expect($scope.entries.length).toBe(2);
      expect($scope.newEntry.subjectName).toBe('');
    });

    it('zeigt die Meldung des Backends, wenn das letzte Schreibrecht entfiele', function () {
      $httpBackend.expectDELETE('/backend/simulation/access/JOB/5/USER/bob')
        .respond(409, {error: 'Das letzte Schreibrecht an der Ressource kann nicht entzogen werden'});

      $scope.remove($scope.entries[0]);
      $httpBackend.flush();

      expect($scope.error).toContain('letzte Schreibrecht');
    });

    it('erklaert eine Ablehnung wegen fehlenden Schreibrechts', function () {
      $httpBackend.expectPUT('/backend/simulation/access/JOB/5').respond(403, {error: 'x'});

      $scope.newEntry.subjectName = 'carol';
      $scope.add();
      $httpBackend.flush();

      expect($scope.error).toContain('Schreibrecht');
    });
  });

  describe('AuthService.isAdministrator', function () {
    it('erkennt die Administratorgruppe aus dem Verzeichnis', inject(function (AuthService) {
      window.sessionStorage.setItem('irpsim.auth.groups', JSON.stringify(['irpsim-admins']));
      expect(AuthService.isAdministrator()).toBe(true);

      window.sessionStorage.setItem('irpsim.auth.groups', JSON.stringify(['irpsim-viewers']));
      expect(AuthService.isAdministrator()).toBe(false);
    }));
  });

  describe('Werkzeugleiste', function () {
    it('zeigt nach der Anmeldung Benutzer, Verwaltung und Modelle an', inject(function ($componentController, AuthService) {
      var toolbar = $componentController('appToolbar', {$scope: $rootScope.$new()});
      toolbar.$onInit();
      expect(toolbar.username).toBeNull();

      $httpBackend.expectPOST('/backend/simulation/auth/login')
        .respond(200, {token: 't', username: 'alice', groups: ['irpsim-admins']});
      $httpBackend.expectGET('/backend/simulation/modeldefinitions').respond(200, [{id: 1, name: 'IRPopt'}]);
      AuthService.login('alice', 'alice123');
      $httpBackend.flush();

      expect(toolbar.username).toBe('alice');
      expect(toolbar.isAdministrator).toBe(true);
      expect(toolbar.modelDefinitions.length).toBe(1);

      $httpBackend.expectPOST('/backend/simulation/auth/logout').respond(204, '');
      AuthService.logout();
      $httpBackend.flush();

      expect(toolbar.username).toBeNull();
      expect(toolbar.isAdministrator).toBe(false);
    }));
  });

  describe('Stammdaten-Zwischenspeicher', function () {
    it('laedt die Stammdaten nach der Anmeldung fuer den neuen Benutzer neu', inject(function (AuthService, Datasets) {
      $httpBackend.flush();
      Datasets.data = [{id: 1, name: 'von bob'}];

      $httpBackend.expectPOST('/backend/simulation/auth/login')
        .respond(200, {token: 't', username: 'carol', groups: []});
      $httpBackend.expectGET('/backend/simulation/stammdaten?all=true').respond(200, [{id: 2, name: 'fuer carol'}]);
      AuthService.login('carol', 'carol123');
      $httpBackend.flush();

      expect(Datasets.data.length).toBe(1);
      expect(Datasets.data[0].id).toBe(2);
    }));
  });

  describe('ScenarioDefinitions', function () {
    it('liefert fuer alle Modelle aus dem Zwischenspeicher dieselbe Struktur wie vom Backend', inject(function (ScenarioDefinitions) {
      $httpBackend.whenGET('/backend/simulation/generalinformation/versions').respond(200, {});
      $httpBackend.expectGET('/backend/simulation/modeldefinitions?all=true')
        .respond(200, {1: {data: {definitions: {scalars: {a: {name: 'a'}}, sets: {}}}}});

      var fromBackend, fromCache;
      ScenarioDefinitions.loadDefinition('all').then(function (d) { fromBackend = d; });
      $httpBackend.flush();
      ScenarioDefinitions.loadDefinition('all').then(function (d) { fromCache = d; });
      $rootScope.$digest();

      expect(fromBackend.scalars.a.name).toBe('a');
      expect(fromCache).toEqual(fromBackend);
    }));
  });

  describe('authInterceptor', function () {
    var authInterceptor, growl;

    beforeEach(inject(function (_authInterceptor_, _growl_) {
      authInterceptor = _authInterceptor_;
      growl = _growl_;
      spyOn(growl, 'error');
    }));

    it('meldet fehlende Berechtigungen', function () {
      authInterceptor.responseError({status: 403, config: {url: '/backend/simulation/stammdaten/4'}}).catch(angular.noop);
      expect(growl.error).toHaveBeenCalled();
    });

    it('ueberlaesst die Meldung dem Freigabedialog', function () {
      authInterceptor.responseError({status: 403, config: {url: '/backend/simulation/access/JOB/4'}}).catch(angular.noop);
      expect(growl.error).not.toHaveBeenCalled();
    });
  });
});
