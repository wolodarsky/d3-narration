import Ember from 'ember';
import { csv } from 'd3-request';

export default Ember.Controller.extend({
  init() {
    this._super(...arguments);
    csv('vehicles-trim.csv').get( r => this.set("data", r));
  },

  makeOptions: Ember.computed("data", function() {
    let data = this.get("data");

    if (data) {
      return data.uniqBy("make").map(c => c.make);
    } else {
      return [];
    }
  }),

  actions: {
    updateMake(e) {
      //this.set("make", e.target.value);
    }
  }
});
