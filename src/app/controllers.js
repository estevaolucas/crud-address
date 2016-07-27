'use strict';

import GoogleMapsLoader from 'google-maps';

export class AddressController {
  constructor($scope, $timeout, lead) {
    this.$scope = $scope;

    // data
    this.lead = lead;
    this.$scope.lead = lead;

    this.googleMapsLoaded = false;
    this.defaultPosition = {lat: 37.09024, lng: -95.712891};
    this.loadMaps();
    
    // events
    $scope.$addComplete = this.$addComplete.bind(this);
    $scope.$edit = this.$edit.bind(this);
    $scope.$editComplete = this.$editComplete.bind(this);
    $scope.$remove = this.$remove.bind(this);
    $scope.$mouseleave = this.$mouseleave.bind(this);
    $scope.$overOnAddress = this.$overOnAddress.bind(this);
    $scope.$overOnAddAddress = this.$overOnAddAddress.bind(this);
  }

  loadMaps() {
    GoogleMapsLoader.KEY = 'AIzaSyA-EiU2h8cvuoqIan0fEQ0XqbGAgxlpy8A';
    GoogleMapsLoader.LIBRARIES = ['places'];
    GoogleMapsLoader.load(google => this.buildMap());
  }

  buildMap() {
    const modal = document.querySelector('.addresses'),
      mapElem = modal.querySelector('.map div');

    this.modal = modal;
    this.googleMapsLoaded = true;
    
    this.map = new google.maps.Map(mapElem, {
      zoom: 8,
      center: new google.maps.LatLng(-34.397, 150.644)
    });

    this.markers = [];

    this.geocoder = new google.maps.Geocoder();
    this.bounds = new google.maps.LatLngBounds();

    // add one pin to each address
    this.addAddressesMarker();
    // create a pin that willl be used when add a new address
    this.createAddMarker();
    // a better way to search for a place
    this.addSerchBox();

    // add data
    this.$scope.$apply(() => {
      this.$scope.list = this.lead.data.addresses;
      this.$scope.label = 'primary';
    });
  }

  addAddressesMarker() {
    this.lead.data.addresses.forEach((address, i) => {
      this.geocoder.geocode({
        address: address.formatted
      }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results.length) {
          const marker = new google.maps.Marker({
            map: this.map,
            anchorPoint: new google.maps.Point(0, -29),
            position: results[0].geometry.location,
          }); 

          // set a numered icon
          this.setMarkerNumber(marker, i + 1);

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

  addSerchBox() {
    const input = this.modal.querySelector('.map input'),
      autocomplete = new google.maps.places.Autocomplete(input);
    
    autocomplete.bindTo('bounds', this.map);
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      let marker = this.addMarker;

      this.hideMarkers();

      // if the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        this.map.fitBounds(place.geometry.viewport);
      } else {
        this.map.setCenter(place.geometry.location);
        this.map.setZoom(17);
      }

      if (this.editingAddress) {
        marker = this.editingAddress.marker;
      }

      marker.setPosition(place.geometry.location);
      marker.setAnimation(null);
      marker.setVisible(true);
      marker.setAnimation(google.maps.Animation.DROP);
    });

    this.searchBoxInput = input;
  }

  // Markers
  createAddMarker() {
    this.addMarker = new google.maps.Marker({
      map: this.map,
      anchorPoint: new google.maps.Point(0, -29),
      position: this.defaultPosition,
      draggable: true,
      visible: false,
      animation: google.maps.Animation.DROP,
    });

    google.maps.event.addListener(this.addMarker, 'dragend', () => {
      this.geocoder.geocode({
        location: this.addMarker.getPosition()
      }, (results, status) => {
        this.bounds.extend(this.addMarker.getPosition());

        if (status === google.maps.GeocoderStatus.OK && results[1]) {
          this.$scope.$apply(() => {
            this.$scope.place = results[1];
            this.$scope.value = results[1].formatted_address;            
            this.searchBoxInput.value = results[1].formatted_address;
          });
        }
      });
    });

    this.setMarkerNumber(this.addMarker, this.lead.data.addresses.length + 1);

    this.$scope.addMarker = this.addMarker;
  }

  showAddMarker() {
    this.map.setCenter(this.addMarker.getPosition());
    this.addMarker.setVisible(true);

    this.setMarkerNumber(this.addMarker, this.lead.data.addresses.length + 1);
  }

  hideAddMarker() {
    this.addMarker.setVisible(false);
  }

  showMarkers() {
    this.markers.forEach(m => m.setVisible(true));
    this.map.fitBounds(this.bounds);
  }

  hideMarkers(marker) {
    if (!this.googleMapsLoaded) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    this.markers.forEach(m => {
      m.setVisible(marker && m == marker);
      marker && m == marker && bounds.extend(m.getPosition());
    });

    this.map.fitBounds(bounds);
  }

  setMarkerNumber(marker, number) {
    marker.setIcon(`http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=${number}|FE6256|000000`);
  }

  cancelEditing(a) {
    this.$scope.list
      .filter(address => a !== address && (address.editing || address.removing))
      .forEach(address => {
        address.editing = false;
        address.removing = false;

        this.editingAddress = null;
      });
  }

  // Event listners
  $addComplete(address, place) {
    return this.lead.addAddress(address).then((list) => {
      const marker = new google.maps.Marker({
        map: this.map,
        anchorPoint: new google.maps.Point(0, -29),
        position: place.geometry.location,
      });

      // set a number to marker
      this.setMarkerNumber(marker, this.$scope.list.length);

      // adjust map position
      this.bounds.extend(marker.getPosition());
      this.map.fitBounds(this.bounds);
      
      this.markers.push(marker);
      this.$scope.list = list.map(a => {
        if (a.formatted == address.formatted) {
          a.marker = marker;
        }

        return a;
      });

      this.searchBoxInput.value = '';

      this.$overOnAddAddress();
    });
  };
  
  $edit(e, address) {
    address.marker.setDraggable(true);
    this.editingAddress = address;
  }

  $editComplete(address) {
    return this.lead.editAddress(address).then(list => {
      this.$scope.list = list;
    });

    this.editingAddress = null;
    this.searchBoxInput.value = '';
  }

  $remove(address) {
    return this.lead.removeAddress(address).then(list => {
      this.lead.data.addresses = list;
      this.$scope.list = list;

      // remove old marker
      if ('marker' in address) {
        address.marker.setMap(null);
      }
      
      // update markers number
      list.forEach((a, i) => {
        this.setMarkerNumber(a.marker, i + 1);
      });
    });
  }

  $overOnAddress(address) {
    if (!this.googleMapsLoaded) {
      return;
    }

    this.hideMarkers(address.marker);
    this.hideAddMarker();
    this.cancelEditing(address);
  }

  $mouseleave(address) {
    this.showMarkers();
    this.hideAddMarker();
  }

  $overOnAddAddress() {
    this.hideMarkers();
    this.showAddMarker();
    this.cancelEditing();
  }
}

AddressController.$inject = ['$scope', '$timeout', 'lead'];
