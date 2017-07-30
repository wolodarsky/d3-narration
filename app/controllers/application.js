import Ember from 'ember';
import { csv } from 'd3-request';
import { nest } from 'd3-collection';

export default Ember.Controller.extend({
  make: "Chevrolet",
  carModel: "_none_",

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

  currentTarget: Ember.computed("make", "carModel", function() {
    let model = this.get("carModel");
    return model && model !== "_none_" ? model : this.get("make");
  }),

  modelOptions: Ember.computed("data", "make", function() {
    let data = this.get("data");
    let make = this.get("make");

    if (data && make) {
      let filtered = data.filterBy("make", make)

      let rollup = nest()
          .key( d => d.model)
          .key( d => d.year )
          .entries(filtered);

      return rollup.filter(r => r.values.length > 1).map(c => c.key);
    } else {
      return [];
    }
  }),

  actions: {
    updateMake(e) {
      this.set("make", e.target.value);
      this.set("carModel", "_none_");
    },

    updateModel(e) {
      this.set("carModel", e.target.value);
    }
  }
});
