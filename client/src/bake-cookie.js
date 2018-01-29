import {inject, } from 'aurelia-framework'
import {BindingSignaler} from 'aurelia-templating-resources';


import {Sawtooth} from 'sawtooth'

@inject(BindingSignaler, Sawtooth)
export class BakeCookie {
  constructor(signaler, sawtooth){
    this.signaler = signaler;
    this.sawtooth = sawtooth;
  }

  bakeCookie() {
    console.log('baking', this.sawtooth);
    const txn = `bake:1`;
    this.batchId = this.sawtooth.sendTransaction(txn, (err, body) => {
      this.error = err;
      this.result = body;
      console.log("Bake txn done.", err, body);
      this.signaler.signal('sent');
    });
    this.signaler.signal('sent');

  }
}

