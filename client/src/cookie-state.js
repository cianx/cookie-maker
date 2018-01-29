import {inject} from 'aurelia-framework'
import {BindingSignaler} from 'aurelia-templating-resources';

import {CookieMakerClient} from 'cookie-maker-client'

@inject(BindingSignaler, CookieMakerClient)
export class CookieState {
  constructor(signaler, client) {
    this.signaler = signaler;
    this.client = client;
  }

  attached() {
    this.updateState();
  }

  detached() {
     clearTimeout(this.timerId);
  }

  decodeState(state) {
    this.state = {}
    for (let item of state) {
        let value = window.atob(item.data);
        this.state[item.address] = value;
    }
    this.signaler.signal('updated');
  }

  updateState() {
    console.log("updateState");
    this.client.getState(result => this.decodeState(result.data));
    this.timerId = setTimeout(() => this.updateState(), 2000);
  }
}


export class ObjectKeysValueConverter {
    toView(obj) {
        if(obj) return Object.keys(obj);
        return []
    }
}
