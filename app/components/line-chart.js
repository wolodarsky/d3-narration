import Ember from 'ember';
import { scaleLinear, scaleBand, schemeCategory20, scaleOrdinal} from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { max, mean, ascending } from 'd3-array';
import { line } from 'd3-shape';
import { nest } from 'd3-collection';

export default Ember.Component.extend({
  groupBy: "make",
  rollup: "comb08",
  filter: "",

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

    let svg = select("#" + this.get("chartId"))
        .attr("width", this.width + this.margin.left + this.margin.right*3)
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

  didReceiveAttrs() {
    this._super(...arguments);
    this.updateChart();
  },

  updateChart() {
    let rawData = this.get('data');

    if (!rawData) return;

    let filter = this.get("filter");
    let data = filter ? rawData.filterBy("model", filter) : rawData;

      let rollup = this.get("rollup");
      let groupBy = this.get("groupBy");

      let yearlyAvgMpgByMake = nest()
        .key( d => d[groupBy] )
        .key( d => d.year )
        .rollup( d => mean( d, car => +car[rollup] ) )
        .entries(data);

      this.x.domain(data.map( d => d.year ));

      this.y.domain([0, max( yearlyAvgMpgByMake, d => max(d.values, c => c.value) ) ]);
      this.updateAxes();

      let svg = select("#" + this.get("chartId"))
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

      let color = scaleOrdinal(schemeCategory20);

      let make = svg.selectAll(".make")
        .data(yearlyAvgMpgByMake)
        .enter().append("g")
        .attr("class", "make");

      make.append("path") // enter
          .attr("fill", "none")
          .attr("stroke", d => color(d.key))
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 2)
          .attr("d", d => this.line(d.values) );

      let taken = [];

      make.append("text")
            .datum( d =>  {
              return { id: d.key, value: d.values[d.values.length - 1]};
            })
            .attr("transform", d => {
              return "translate(" + this.x(d.value.key) + "," + this.y(d.value.value) + ")";
            })
            .attr("x", 3)
            .attr("dy", "0.35em")
            .attr("font-size", "11px")
            .attr("fill", d => color(d.id))
            .text( d => d.id );


      let annotation = this.get("annotation");

      if (annotation) {
        this.addAnnotation(svg, annotation);
      }
      //.merge(line) // update
        //.attr("class", "line")
        //.attr("fill", "none")
        //.attr("stroke", "steelblue")
        //.attr("stroke-linejoin", "round")
        //.attr("stroke-linecap", "round")
        //.attr("stroke-width", 1.5)
        //.attr("d", this.line);

    //});

  },

  annotations: {
    honda: {"y": 0, "x": 795, text: "Honda's average MPG peaks with the Fit EV"},
    dodge: {"y": 0, "x": 875, text: "Dodge's displacement peaks with a dip in average MPG"}
  },

  addAnnotation(svg, name) {
      let a = this.get("annotations")[name];

      svg.append("circle")
          .attr("r", 10)
          .attr("fill", "none")
          .attr("stroke", "gray")
          .attr("stroke-width", 2)
          .attr("cy", 0)
          .attr("stroke-dasharray", "3,3")
          .attr("cx", a.x);

      svg.append("path")
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .attr("d", `M ${a.x-15} ${a.y} L ${a.x-85} ${a.y}`);

      svg.append("text")
          .attr("font-size", "11px")
          .attr("text-anchor", "end")
          .attr("dx", a.x - 90)
          .attr("dy", a.y+2.5)
          .text(a.text)
  }
});
