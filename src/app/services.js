'use strict';

export class Lead {
  constructor($q) {
    this.$q = $q;
  }

  // TODO: simulate with a simple server
  fetchData(leadId) {
    const deferred = this.$q.defer(),
      lead = {
        name: 'Close.id (SampleLead)',
        addresses: [{
          address_1: '501 Forest Ave',
          address_2: 'Suite 1201',
          city: 'Palo Alto',
          country: 'US',
          label: 'primary',
          state: 'CA',
          zipcode: '94301',

          formatted: '501 Forest Ave, Suite 1201, Palo Alto, CA, US - 94301',
        }]
      };

    this.data = lead;
    deferred.resolve(this);
    
    return deferred.promise;
  }

  addAddress(address) {
    const deferred = this.$q.defer();

    this.data.addresses.push(address);
    deferred.resolve(this.data.addresses.slice());
    
    return deferred.promise;
  }

  removeAddress(address) {
    const deferred = this.$q.defer();

    this.data.addresses.splice(this.data.addresses.indexOf(address), 1);
    deferred.resolve(this.data.addresses.slice());
    
    return deferred.promise; 
  }
}

Lead.$inject = ['$q'];
