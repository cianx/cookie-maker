import {inject} from 'aurelia-framework'

import {state} from 'state'

@inject(state)
export class MyCookies {
  constructor(state){
    this.state = state;
  }
}
