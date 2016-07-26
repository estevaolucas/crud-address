'use strict';

export class Lead {
  constructor($q, $http) {
    this.$q = $q;
    this.$http = $http;

    this.baseUrl = 'http://localhost:3000';
  }

  // TODO: simulate with a simple server
  fetchData(leadId) {
    const deferred = this.$q.defer();

    this.id = leadId;

    this.$http.get(`${this.baseUrl}/leads/${leadId}?_embed=addresses`)
      .then((response) => {
        this.data = this.normalize(response.data);
        
        deferred.resolve(this);
      }, (error) => {
        deferred.reject(error);
      })

    return deferred.promise;
  }

  normalize(data) {
    data.addresses.map((a) => {
      // needed to present for autocomplete
      a.formatted = `${a.address_1} ${a.address_2}, ${a.city}, ${a.state}, ${a.country} - ${a.zipcode}`;
      return a;
    });

    return data;
  }

  prepareToSend(address) {
    const a = {
      address_1: address.address_1 || '',
      address_2: address.address_2 || '',
      city: address.city,
      country: address.country,
      label: address.label,
      state: address.state,
      zipcode: address.zipcode || '',
    }

    return a;
  }

  addAddress(address) {
    const deferred = this.$q.defer();

    this.$http.post(`${this.baseUrl}/leads/${this.id}/addresses`, this.prepareToSend(address))
      .then((response) => {
        this.data.addresses.push(angular.extend({}, address, response.data));
        deferred.resolve(this.data.addresses.slice());
      }, (error) => {
        deferred.reject(error);
      })

    return deferred.promise;
  }

  editAddress(address) {
    const deferred = this.$q.defer();

    this.data.addresses[this.data.addresses.indexOf(address)] = address;
    deferred.resolve(this.data.addresses.slice());
    
    return deferred.promise; 
  }

  removeAddress(address) {
    const deferred = this.$q.defer()

    this.$http.delete(`${this.baseUrl}/addresses/${address.id}`)
      .then((response) => {
        this.data.addresses.splice(this.data.addresses.indexOf(address), 1);
        deferred.resolve(this.data.addresses.slice());
      }, (error) => {
        deferred.reject(error);
      })

    return deferred.promise; 
  }
}

Lead.$inject = ['$q', '$http'];
