'use strict';

const componentForm = {
  address_1: ['short_name', 'street_number'],
  address_2: ['long_name', 'route'],
  city: ['long_name', 'locality'],
  state: ['short_name', 'administrative_area_level_1'],
  zipcode: ['short_name', 'postal_code'],
  country: ['short_name', 'country'],
};

export class AddressDirective {
  constructor() {
    this.restrict = 'E';
    this.template = require('./address.html');
    this.replace = true;
    this.scope = {
      address: '=',
      index: '=',
      onEdit: '=',
      onEditComplete: '=',
      onRemove: '=',
      onOver: '=',
    };
  }

  link(scope, element, attrs) {
    this.scope = scope;

    scope.input = element[0].querySelector('input.text');
    
    scope.$edit = (e) => {
      scope.address.editing = true;
      scope.onEdit(e, scope.address);
    }

    scope.$remove = () => {
      scope.address.removing = true;
    }

    scope.$confirm = (confirm) => {
      scope.address.removing = false;

      if (confirm) {
        scope.onRemove(scope.address).then(() => {}, () => scope.addError());
      }
    }

    scope.$over = (address) => {
      scope.onOver(scope.address);
    }

    scope.addEditAutocomplete = (address) => {
      let place = false;

      if (!('autocomplete' in address)) {
        const autocomplete = new google.maps.places.Autocomplete(scope.input, {
          types: ['geocode']
        });

        google.maps.event.addListener(autocomplete, 'place_changed', () => {
          scope.editAutocompleteHandler(address, autocomplete.getPlace());
        });

        // press enter key adds a new address
        scope.input.addEventListener('keypress', e => {
          if (e.keyCode == 13) {
            scope.editAutocompleteHandler(address, place);
          }
        });
        
        google.maps.event.addListener(address.marker, 'dragend', () => {
          new google.maps.Geocoder().geocode({
            location: address.marker.getPosition()
          }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results[1]) {
              place = results[1];
              
              scope.input.value = results[1].formatted_address;
              scope.input.focus();
            }
          });
        });
        
        scope.address.autocomplete = autocomplete;
      }
    }

    scope.editAutocompleteHandler = (address, place) => {
      if (!place || !('formatted_address' in place)) {
        scope.$apply(() => {
          address.marker.setDraggable(false);
          address.editing = false;
        });

        return;
      }

      address.formatted = place.formatted_address;

      place.address_components.forEach(component => {
        const addressType = component.types[0],
          editedMarker = address.marker;

        for (const c in componentForm) {
          if (addressType === componentForm[c][1]) {
            address[c] = component[componentForm[c][0]];
          }
        }
      });

      scope.onEditComplete(address);

      address.marker.setDraggable(false);
      address.editing = false;

      scope.address = address;
    }

    scope.addError = () => {
      scope.error = true;

      setTimeout(() => scope.error = false, 500);
    }

    const watch = scope.$watch('address.marker', (newValue, oldValue) => {
      if (newValue === oldValue) {
        return;
      }

      scope.addEditAutocomplete(scope.address);

      watch();
    })
  }
}

AddressDirective.$inject = ['$scope'];

export class AddNewAddressDirective {
  constructor() {
    this.restrict = 'E';
    this.template = require('./add-new-address.html');
    this.replace = true;
    this.scope = {
      onAdd: '=',
      onOver: '=',
      marker: '=',
      value: '=',
      place: '=',
      index: '=',
    };
  }

  link(scope, element, attrs) {
    scope.label = scope.index == 1 ? 'primary' : 'other';
    scope.input = element[0].querySelector('input.text');
    scope.autocomplete = new google.maps.places.Autocomplete(scope.input, {
      types: ['geocode']
    });

    google.maps.event.addListener(scope.autocomplete, 'place_changed', () => {
      scope.autocompleteHandler(scope.autocomplete.getPlace());
    });

    // press enter key adds a new address
    scope.input.addEventListener('keypress', e => {
      if (e.keyCode == 13) {
        scope.autocompleteHandler(scope.place);
      }
    });
        
    scope.autocompleteHandler = (place) => {
      const address = {};

      // can be a place without not so deep, like a city or a state
      if (!place || !('formatted_address' in place)) {
        return;
      }

      address.formatted = place.formatted_address;
      address.label = scope.label;

      place.address_components.forEach(component => {
        const addressType = component.types[0];

        for (const c in componentForm) {
          if (addressType === componentForm[c][1]) {
            address[c] = component[componentForm[c][0]];
          }
        }
      });

      scope.onAdd(address, place)
        .then(() => {
          scope.input.value = '';
          scope.label = 'other';
        }, 
        () => scope.addError());
    }

    scope.$over = () => {
      scope.onOver();
    }

    scope.$watch('value', (newValue, oldValue) => {
      if (newValue === oldValue) {
        return;
      }

      scope.input.value = scope.value;
    });
  }
}

AddNewAddressDirective.$inject = ['$scope'];
