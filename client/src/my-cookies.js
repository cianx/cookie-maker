import {inject} from 'aurelia-framework'

import {BindingSignaler} from 'aurelia-templating-resources';


import {CookieMakerClient} from 'cookie-maker-client'

@inject(BindingSignaler, CookieMakerClient)
export class MyCookies {
  constructor(signaler, client){
    this.signaler = signaler;
    this.client = client;
    this.publicKey = client.publicKey;
    this.address = client.address;
  }

  attached() {
    this.updateState();
  }

  detached() {
     clearTimeout(this.timerId);
  }

  decodeState(state) {
    // get convert the base64 encoded value to string
    this.cookies = window.atob(state);
    this.signaler.signal('updated');
  }

  updateState() {
    this.client.getMyState(result => this.decodeState(result.data));

    this.timerId = setTimeout(() => this.updateState(), 1000);
  }

}
