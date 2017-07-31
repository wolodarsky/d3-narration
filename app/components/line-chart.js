import Ember from 'ember';
import { scaleLinear, scaleBand, schemeCategory20, scaleOrdinal} from 'd3-scale';
import { axisBottom, axisLeft, axisRight } from 'd3-axis';
import { select } from 'd3-selection';
import { max, mean } from 'd3-array';
import { line } from 'd3-shape';
import { nest } from 'd3-collection';

export default Ember.Component.extend({
  groupBy: "make",
  rollup: "comb08",
  filter: "",
  rollupPretty: {"comb08": "MPG", "displ": "Displacement in Liters"},

  init() {
    this._super(...arguments);
    this.margin = { top: 20, right: 40, bottom: 30, left: 40 };
    this.width = 900 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;

    this.x = scaleBand()
        .range([30, this.width])
        .padding(0.5);

    this.y = scaleLinear()
        .range([this.height, 0]);

    this.yRight = scaleLinear()
        .range([this.height, 0]);

    this.line = line()
      .x( d => this.x(d.key) )
      .y( d => this.y(d.value) );

    this.lineRight = line()
      .x( d => this.x(d.key) )
      .y( d => this.yRight(d.value) );

    this.updateAxes();
  },

  updateAxes() {
    this.xAxis = axisBottom(this.x)
        .tickFormat(d => d.toString().slice(-2))
    this.yAxis = axisLeft(this.y)
        .ticks(10, 's');
    this.yRightAxis = axisRight(this.yRight)
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

    if (this.get("secondRollup")) {
      svg.append("g")
          .attr("class", "y right-axis")
          .attr("transform", "translate( " + (this.width+30) + ", 0 )")
          .call(this.yRightAxis);
    }

    this.updateChart();
  },

  didUpdateAttrs() {
    this._super(...arguments);
    this.updateChart();
  },

  updateChart() {
    let rawData = this.get('data');

    if (!rawData) return;

    let filter = this.get("filter");
    let modelFilter = this.get("modelFilter") ;
    let data;

    if (modelFilter && modelFilter !== "_none_") {
      data = rawData.filterBy("model", modelFilter);
    } else {
      data = filter ? rawData.filterBy("make", filter) : rawData;
    }
    let secondYearlyRollup;

    let rollup = this.get("rollup");
    let secondRollup = this.get("secondRollup");
    let groupBy = this.get("groupBy");

    let yearlyRollup = nest()
      .key( d => d[groupBy] )
      .key( d => d.year )
      .rollup( d => mean( d, car => +car[rollup] ) )
      .entries(data);


    this.x.domain(data.map( d => d.year ));

    this.y.domain([0, max( yearlyRollup, d => max(d.values, c => c.value) ) ]);

    if (secondRollup) {
      secondYearlyRollup = nest()
          .key( d => d[groupBy] )
          .key( d => d.year )
          .rollup( d => mean( d, car => +car[secondRollup] ) )
          .entries(data);
      this.yRight.domain([0, max( secondYearlyRollup, d => max(d.values, c => c.value) ) ]);
    }

    this.updateAxes();

    let svg = select("#" + this.get("chartId"))
      .select("g");

    svg.select(".x.axis")
        .call(this.xAxis);

    svg.select(".y.axis")
        .call(this.yAxis);

    if (secondRollup) {
      svg.select(".y.right-axis")
          .call(this.yRightAxis);
    }

    if (secondRollup) {
      this.drawLines(svg, "rollup1", this.y, this.line, yearlyRollup, false, "MPG");
      this.drawLines(svg, "rollup2", this.yRight, this.lineRight, secondYearlyRollup, true, "Displ.");
    } else {
      this.drawLines(svg, "rollup1", this.y, this.line, yearlyRollup);
    }

    let annotation = this.get("annotation");

    if (annotation) {
      this.addAnnotation(svg, annotation);
    }

    svg.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("font-size", "10px")
            .attr("transform", "translate("+ (15) +","+(this.height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
            .text(this.get("rollupPretty")[rollup]);

    if (secondRollup) {
      svg.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("font-size", "10px")
        .attr("transform", "translate("+ (this.width+15) +","+(this.height/2)+")rotate(90)")  // text is drawn off the screen top left, move down and out and rotate
        .text("Displacement in Liters");
    }

    svg.append("text")
            .attr("font-size", "10px")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (this.width/2) +","+(this.height-10)+")")  // centre below axis
            .text("Year");
  },

  annotations: {
    honda: {"y": 0, "x": 729, text: "Honda's average MPG peaks with the Fit EV"},
    dodge: {"y": 0, "x": 798, text: "Dodge's displacement peaks with a dip in average MPG"}
  },

  drawLines(svg, name, fy, yLine, data, dotted = false, label = "") {
    let color = scaleOrdinal(schemeCategory20);

    let lines = svg.selectAll("." + name)
      .data(data)

    let make = lines.enter().append("g");

    let path = make
      .append("path") // enter
      .attr("class", name)
        .attr("fill", "none")
        .attr("stroke", d => color(d.key))
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 2)
        .attr("d", d => yLine(d.values) )
    let merge = path.merge(lines)
        .attr("fill", "none")
        .attr("stroke", d => color(d.key))
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 2)
        .attr("d", d => yLine(d.values) );

    if (dotted) {
      merge.attr("stroke-dasharray", "3,3")
    }

    let txt = make.append("text")
          .datum( d =>  {
            return { id: d.key, value: d.values[d.values.length - 1]};
          })
          .attr("transform", d => {
            return "translate(" + this.x(d.value.key) + "," + fy(d.value.value) + ")";
          })
          .attr("x", 3)
          .attr("dy", "0.35em")
          .attr("font-size", "11px")
          .attr("fill", d => color(d.id))

    if(label) {

      svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#1f77b4")
        .attr("stroke-width", 1)
        .attr("d", `M ${(this.width/4)*2} ${this.height*.9} L ${(this.width/4)*2+50} ${this.height*.9}`);

      svg.append("text")
        .attr("font-size", "11px")
        .attr("dx", (this.width/4)*2+60)
        .attr("dy", this.height*.9+2.5)
        .text("MPG")

      svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#1f77b4")
        .attr("stroke-width", 1)
        .attr("d", `M ${(this.width/4)} ${this.height*.9} L ${(this.width/4)+50} ${this.height*.9}`)
        .attr("stroke-dasharray", "3,3")

      svg.append("text")
        .attr("font-size", "11px")
        .attr("dx", (this.width/4)+60)
        .attr("dy", this.height*.9+2.5)
        .text("Displacement")

    } else {
      txt.text( d => d.id );
    }
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
