'use strict';

import angular from 'angular';
import uiRouter from 'angular-ui-router';
import { AddressController } from './controllers';
import { Lead } from './services';

import '../style/app.css';

angular.module('app', [uiRouter])
  .controller('AddressController', AddressController)
  
  .factory('lead', Lead.factory)

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
          },
        },
      });
  });

export default 'app';
