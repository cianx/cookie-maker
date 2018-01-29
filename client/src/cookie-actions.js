import {inject, } from 'aurelia-framework'
import {BindingSignaler} from 'aurelia-templating-resources';


import {CookieMakerClient} from 'cookie-maker-client'

@inject(BindingSignaler, CookieMakerClient)
export class CookieActions {
  constructor(signaler, client){
    this.signaler = signaler;
    this.client = client;

    this.bake = {}
    this.eat = {}
  }

  bakeCookie() {
    const txn = `bake`;
    this.bake.batchId = this.client.sendTransaction(txn, (err, body) => {
      this.bake.error = err;
      this.bake.result = body;
      console.log("Bake txn done.", err, body);
    });
  }
  eatCookie() {
    const txn = `eat`;
    this.eat.batchId = this.client.sendTransaction(txn, (err, body) => {
      this.eat.error = err;
      this.eat.result = body;
      console.log("Eat txn done.", err, body);
    });
  }
}

