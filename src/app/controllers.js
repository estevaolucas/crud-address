'use strict';

import GoogleMapsLoader from 'google-maps';

export class AddressController {
  constructor($scope) {
    this.$scope = $scope;

    this.list = [];
    this.type = '';

    this.componentForm = {
      street_number: 'short_name',
      route: 'long_name',
      locality: 'long_name',
      administrative_area_level_1: 'short_name',
      country: 'long_name',
      postal_code: 'short_name'
    };

    this.componentForm = {
      streetNumber: {
        display: 'short_name',
        type: 'street_number',
      },
      streetName: {
        display: 'long_name',
        type: 'route',
      },
      city: {
        display: 'long_name',
        type: 'locality',
      },
      state: {
        display: 'short_name',
        type: 'administrative_area_level_1',
      },
      zipcode: {
        display: 'short_name',
        type: 'postal_code',
      },
      country: {
        display: 'long_name',
        type: 'country',
      },
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

    this.geocoder = new google.maps.Geocoder();

    this.addCleanMarker();

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

    google.maps.event.addListener(this.addMarker, 'dragend', () => {
      this.geocoder.geocode({
        location: this.addMarker.getPosition()
      }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results[1]) {
          this.addAutocompletePlace = results[1];
          this.addInput.value = results[1].formatted_address;
          this.addInput.focus();
        }
      });
    });
  }

  addAutocompleteHandler(marker, place) {
    const address = {
        place: place,
        type: this.type,
        component: {}
      };

    if (!place || !('address_components' in place)) {
      return;
    }

    place.address_components.forEach(component => {
      const addressType = component.types[0];

      for (const c in this.componentForm) {
        if (addressType === this.componentForm[c].type) {
          address.component[c] = component[this.componentForm[c].display];
        }
      }
    });

    marker.setVisible(false);

    if (place.geometry.viewport) {
      this.map.fitBounds(place.geometry.viewport);
    } else {
      this.map.setCenter(place.geometry.location);
      this.map.setZoom(17);
    }

    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    this.$scope.$apply(() => this.list.push(address));
    this.addInput.value = '';
  };
}

AddressController.$inject = ['$scope'];
