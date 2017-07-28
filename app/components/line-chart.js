import Ember from 'ember';
import { scaleLinear, scaleBand } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { max } from 'd3-array';
import { line } from 'd3-shape';

export default Ember.Component.extend({

  init() {
    this._super(...arguments);
    this.margin = { top: 20, right: 20, bottom: 30, left: 40 };
    this.width = 960 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;

    this.x = scaleBand()
        .range([0, this.width])
        .padding(0.05);

    this.y = scaleLinear()
        .range([this.height, 0]);

    this.line = line()
      .x( d => this.x(d.key) )
      .y( d => this.y(d.value) );

    this.updateAxes();
  },

  updateAxes() {
    this.xAxis = axisBottom(this.x);
    this.yAxis = axisLeft(this.y)
        .ticks(10, 's');
  },

  didInsertElement() {
    this._super(...arguments);

    let svg = select("#line-chart")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis);

    this.updateChart();
  },

  didUpdateAttrs() {
    this._super(...arguments);
    this.updateChart();
  },

  updateChart() {
    let data = this.get('data');

    this.x.domain(data.map( d => d.key ));
    this.y.domain([0, max( data, d => d.value ) ]);
    this.updateAxes();

    let svg = select("#line-chart")
      .select("g");

    svg.select(".x.axis")
        .call(this.xAxis);

    svg.select(".y.axis")
        .call(this.yAxis);

    //let line = svg.selectAll(".line")
        //.data(data);

    //line.exit().remove(); // exit

    svg.append("path") // enter
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", this.line);
      //.merge(line) // update
        //.attr("class", "line")
        //.attr("fill", "none")
        //.attr("stroke", "steelblue")
        //.attr("stroke-linejoin", "round")
        //.attr("stroke-linecap", "round")
        //.attr("stroke-width", 1.5)
        //.attr("d", this.line);
    //
    //
  }
});
