import Ember from 'ember';
import { csv } from 'd3-request';

export default Ember.Controller.extend({
  hondaChartData: csv('vehicles-trim.csv')
});
