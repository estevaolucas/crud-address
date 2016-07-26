'use strict';

import angular from 'angular';
import uiRouter from 'angular-ui-router';
import { AddressController } from './controllers';
import { Lead } from './services';
import { AddressDirective } from './directives';

import '../style/app.css';

angular.module('app', [uiRouter])
  .controller('AddressController', AddressController)
  .service('Lead', Lead)
  .directive('leadAddress', () => new AddressDirective)

  .config(($stateProvider, $urlRouterProvider) => {
    $stateProvider
      .state('address', {
        url: '/:leadId/addresses',
        views: {
          modal: {
            template: require('./addresses.html'),
          },
        },
        abstract: true,
      })

      .state('address.add', {
        url: '/',
        views: {
          modal: {
            template: require('./add.html'),
            controller: 'AddressController',
            resolve: {
              lead: ($stateParams, Lead) => Lead.fetchData($stateParams.leadId)
            },
          },
        },
      });
  });

export default 'app';
