'use strict';

export class Lead {
  constructor() {
    console.log('lead id:');
  }

  static factory($http){
    return new Lead();
  }
}
