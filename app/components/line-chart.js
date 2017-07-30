import Ember from 'ember';
import { scaleLinear, scaleBand } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { max, mean, ascending } from 'd3-array';
import { line } from 'd3-shape';
import { nest } from 'd3-collection';

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
    this.get('data').get(data => {

      let yearlyAvgMpgByMake = d3.nest()
        .key( d => d.make )
        .key( d => d.year )
        .rollup( d => d3.mean( d, car => +car.comb08 ) )
        .entries(data);

      this.x.domain(data.map( d => d.year ));

      this.y.domain([0, max( yearlyAvgMpgByMake, d => max(d.values, c => c.value) ) ]);
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
      //
      //
      //debugger;

      //yearlyAvgMpgByMake.forEach( m => {

        svg.append("circle")
            .attr("r", 10)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 1)
            .attr("cy", 100)
            .attr("cx", 100)
        ;

        let make = svg.selectAll(".make")
          .data(yearlyAvgMpgByMake)
          .enter().append("g")
          .attr("class", d => d.key + " make");

        make.append("path") // enter
            .attr("fill", "none")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 2)
            .attr("d", d => this.line(d.values) );
        //.merge(line) // update
          //.attr("class", "line")
          //.attr("fill", "none")
          //.attr("stroke", "steelblue")
          //.attr("stroke-linejoin", "round")
          //.attr("stroke-linecap", "round")
          //.attr("stroke-width", 1.5)
          //.attr("d", this.line);

      //});

      const annotations = [{
      note: { label: "Hi"},
      x: 100, y: 100,
      dy: 137, dx: 162,
      subject: { radius: 50, radiusPadding: 10 }
      }];

      d3.annotation().annotations(annotations);
    });
  }
});
