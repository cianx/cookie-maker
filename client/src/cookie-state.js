import {inject} from 'aurelia-framework'

import {state} from 'state'

@inject(state)
export class CookieState {
  constructor(state){
    this.state = state;
  }

}
