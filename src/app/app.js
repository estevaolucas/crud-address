'use strict';

import angular from 'angular';
import uiRouter from 'angular-ui-router';
import { AddressController } from './controllers';
import { Lead } from './services';

import '../style/app.css';

console.log(AddressController);
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
        controller: 'AddressController',
        controllerAs: 'addresses',
        resolve: {
          lead: ($stateParams) => {
            // console.log('resolve', $stateParams);
            return [0, 1, 2];
            // return Lead($stateParams.leadId);
          }
        },
        views: {
          modal: {
            template: require('./add.html'),
          },
        },
      });


    // $urlRouterProvider.otherwise('addresses');
  });

export default 'app';
