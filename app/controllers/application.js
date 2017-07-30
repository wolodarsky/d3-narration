import Ember from 'ember';
import { csv } from 'd3-request';

export default Ember.Controller.extend({
  init() {
    this._super(...arguments);
    csv('vehicles-trim.csv').get( r => this.set("data", r));
  }
});
