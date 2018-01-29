import {inject} from 'aurelia-framework'

import {state} from 'state'

@inject(state)
export class EatCookie {
  constructor(state){
    this.state = state;
  }

  eatCookie() {
    console.log("Eat")
  }

}
