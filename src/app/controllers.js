'use strict';

import GoogleMapsLoader from 'google-maps';

export class AddressController {
  constructor($scope, $timeout, lead) {
    this.$scope = $scope;

    this.lead = lead;

    // data
    $scope.lead = lead;
    $scope.list = lead.data.addresses;
    $scope.label = 'primary';  

    // events
    $scope.$edit = this.$edit.bind(this);
    $scope.$remove = this.$remove.bind(this);
    $scope.$mouseenter = this.$mouseenter.bind(this);
    $scope.$mouseleave = this.$mouseleave.bind(this);
    
    this.componentForm = {
      streetNumber: ['short_name', 'street_number'],
      streetName: ['long_name', 'route'],
      city: ['long_name', 'locality'],
      state: ['short_name', 'administrative_area_level_1'],
      zipcode: ['short_name', 'postal_code'],
      country: ['long_name', 'country'],
    };

    this.loadMaps();
  }

  loadMaps() {
    GoogleMapsLoader.LIBRARIES = ['places'];
    GoogleMapsLoader.load(google => this.buildMap());
  }

  buildMap() {
    const addressElem = document.querySelector('.addresses'),
      mapElem = addressElem.querySelector('.map');

    this.addInput = addressElem.querySelector('.add-address input.text');
    this.addAutocomplete = new google.maps.places.Autocomplete(this.addInput, {types: ['geocode']});
    
    this.map = new google.maps.Map(mapElem, {
      zoom: 8,
      center: new google.maps.LatLng(-34.397, 150.644)
    });

    this.markers = [];

    this.geocoder = new google.maps.Geocoder();
    this.bounds = new google.maps.LatLngBounds();

    this.addCleanMarker();
    this.addAddressesMarker();

    google.maps.event.addListener(this.addAutocomplete, 'place_changed', () => {
      this.addAutocompleteHandler(this.addMarker, this.addAutocomplete.getPlace());
    });

    // press enter key adds a new address
    this.addInput.addEventListener('keypress', e => {
      if (e.keyCode == 13) {
        this.addAutocompleteHandler(this.addMarker, this.addAutocompletePlace);
      }
    });
  }

  addCleanMarker() {
    this.addMarker = new google.maps.Marker({
      map: this.map,
      anchorPoint: new google.maps.Point(0, -29),
      position: this.map.getCenter(),
      draggable: true,
      animation: google.maps.Animation.DROP,
    });

    this.markers.push(this.addMarker);
    this.bounds.extend(this.addMarker.getPosition());

    google.maps.event.addListener(this.addMarker, 'dragend', () => {
      this.geocoder.geocode({
        location: this.addMarker.getPosition()
      }, (results, status) => {
        this.bounds.extend(this.addMarker.getPosition());

        if (status === google.maps.GeocoderStatus.OK && results[1]) {
          this.addAutocompletePlace = results[1];
          this.addInput.value = results[1].formatted_address;
          this.addInput.focus();
        }
      });
    });
  }

  addAutocompleteHandler(marker, place) {
    const address = {};

    if (!place || !('formatted_address' in place)) {
      return;
    }

    address.formatted = place.formatted_address;
    address.label = this.$scope.label;

    place.address_components.forEach(component => {
      const addressType = component.types[0];

      for (const c in this.componentForm) {
        if (addressType === this.componentForm[c][1]) {
          address[c] = component[this.componentForm[c][0]];
        }
      }
    });

    this.lead.addAddress(address).then(list => {
      this.$scope.list = list;

      if (!place.geometry.viewport) {
        const addedMarker = new google.maps.Marker({
          map: this.map,
          anchorPoint: new google.maps.Point(0, -29),
          position: place.geometry.location,
        });

        // set a number to marker
        this.markerIconNumber(addedMarker, this.$scope.list.length);

        // adjust map position
        this.bounds.extend(addedMarker.getPosition());
        this.map.fitBounds(this.bounds);
    
        this.markers.push(addedMarker);
        
        // reset input to add a new address
        this.addInput.value = '';
      }
    });
  };

  addAddressesMarker() {
    this.lead.data.addresses.forEach((address, i) => {
      this.geocoder.geocode({
          address: address.formatted
        }, (results, status) => {
          console.log('address', status, results);
          if (status === google.maps.GeocoderStatus.OK && results.length) {
            const marker = new google.maps.Marker({
              map: this.map,
              anchorPoint: new google.maps.Point(0, -29),
              position: results[0].geometry.location,
            }); 

            // set a numered icon
            this.markerIconNumber(marker, i + 1);

            address.marker = marker;
            this.markers.push(marker);

            // adjust viewport to show all pins
            this.bounds.extend(marker.getPosition());

            if (i == this.lead.data.addresses.length - 1) {
              this.map.fitBounds(this.bounds);
            }
          }
        });
    });
  }

  markerIconNumber(marker, number) {
    marker.setIcon(`http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=${number}|FE6256|000000`);
  }

  // event listners
  $edit(address) {
    address.editing = true;
  }

  $remove(address) {
    this.lead.removeAddress(address).then(list => this.$scope.list = list);
  }

  $mouseenter(address) {
    if (!google) {
      return;
    }
    
    const bounds = new google.maps.LatLngBounds();

    this.markers.forEach(m => {
      m.setVisible(m == address.marker);
      m == address.marker && bounds.extend(m.getPosition());
    });

    this.map.fitBounds(bounds);
  }

  $mouseleave(address) {
    this.markers.forEach(m => m.setVisible(true));
    this.map.fitBounds(this.bounds);
  }
}

AddressController.$inject = ['$scope', '$timeout', 'lead'];
