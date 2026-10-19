> ## My contribution: login and access management UI (2026)
>
> This fork of the [IRPsim UI client](https://github.com/IRPsim/ui-client) (AngularJS)
> is the frontend for my [LDAP and access-control backend work](https://github.com/AtillaBenligil/backend).
> University project.
>
> - **Login:** a login screen, password change, an auth service with an HTTP
>   interceptor that attaches the session token, and the user menu in the toolbar.
> - **Access management:** a sharing dialog to grant users and groups read/write access to
>   scenarios, simulation results and standing data, and a group management page.
> - **Build:** dependency updates that make the Karma test suite run again.
>
> 6 commits, about 1,200 lines added. Commit messages are in German, the project's
> working language.

# Benutzeroberfläche für das IRPsim-Projekt
## Initiale Einrichtung der Entwicklungumgebung

[NPM](http://nodejs.org/download/) ist der *Node.js package manager*. Dieses Werkzeug verwaltet die folgenden Werkzeuge (grunt, bower). Node.js muss entsprechend installiert sein.

[Bower](http://bower.io/) verwaltet Abhängigkeiten zu öffentlichen Projekten (z.B. JQuery, AngularJS, D3 ...)

Installation:

    npm install -g bower

[Grunt](http://gruntjs.com/getting-started) ist das Buildwerkzeug für Frontendprojekte (analog zu Make in C/C++, Ant in Java)

Installation:

    npm install -g grunt-cli

## Bauen des Projektes

Eigentliches Bauen des Projektes zur Entwicklungszeit:

    npm install //installiere/aktualisiere alle Plugins für Grunt
    bower install //installiere/aktualisiere alle Abhängigkeiten (TODO über Grunt automatisieren)
    grunt default
    
## Entwicklungszeit

Zur komfortablen Entwicklung gibt es

    grunt serve
    
Dieser Befeht startet einen lokalen Webserver, öffnet die Anwendung im Browser und lädt die Seite automatisch neu nach jeder Änderung von Dateien des Projektes. 
Dabei wird davon ausgegangen, dass eine Instanz des Backendservers unter ```localhost:8282``` verfügbar ist. Alle Anfragen an das Backend werden dahin umgeleitet.

## Auslieferung

Wahlweise kann auch der finale Stand gebaut werden. Dabei werden CSS und Javascript minimiert und unleserlich gemacht (obfuscation):

    grunt build-staging    // erstellt minimierte, optimierte Version für den Einsatz in QA
    grunt build-production // erstellt minimierte, optimierte Version für den produktiven Einsatz

Zur Betrachtung der finalen, produktiven Version gibt es

    grunt serve:dist --debug
    
## Tests!

Tests werden auf Basis von Karma ausgeführt. Aus diesem Grund muss zur Ersteinrichtung der Karma Client installiert werden mittels

    npm install -g karma-cli
    
Desweiteren muss Chrome auf dem PC installiert sein.
Die Tests können mittels 

    grunt karma:unit

ausgeführt werden. Unter app/test befinden sich die Testklassen.

# Licensing

This project is licensed under GPLv3. 
