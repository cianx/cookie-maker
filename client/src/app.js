import {inject} from 'aurelia-framework'
import {PLATFORM} from 'aurelia-pal';

import {state} from 'state'

@inject(state)
export class App {
    constructor(state) {
        this.state = state;


    }
}
