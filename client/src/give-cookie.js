
import {inject} from 'aurelia-framework'

import {state} from 'state'

@inject(state)
export class GiveCookie {
  constructor(state){
    this.state = state;
  }

  giveCookie() {
    console.log("Give")
  }

}
