/**
 * Created by FeanorCui on 12/6/16.
 */
var headparseDate = d3.time.format("%Y-%m").parse;
var parseDate = d3.time.format("%Y_%m").parse,
    formatDate = d3.time.format("%Y-%b"),
    bisectDate = d3.bisector(function(d) { return d.date; }).left;
function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

var selectedCountry=getURLParameter("country");
var selectedTime=getURLParameter("time");
//selectedTime=selectedTime.replace("-","_");

d3.select("#sec-nav").select("#SCountry").text(selectedCountry);
//d3.select("header").select("#SDate").text(formatDate(headparseDate(selectedTime)));
var built=0;
var margin = {top: 10, right: 40, bottom: 170, left: 100},
    width = 860 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

var svg = d3.select("body").select("#barchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//    svg = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        return "<strong>Intensity:</strong> <span style='color:#9acaec'>" + d.Intensity + "</span>";
    });

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var y = d3.scale.linear()
    .domain([0,30])
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");
change(selectedTime.replace("-","_"));
function change(date) {
    d3.select("#sec-nav").select("#SDate").text(formatDate(parseDate(date)));
    var url="./data/barchartDetail/"+selectedCountry+"_"+date+".csv";
    d3.csv(url, type, function(error, data) {

        //.tickFormat(formatPercent);


        y.domain([0, d3.max(data, function (d) {
            return d.Intensity;
        })]);
        svg.select(".y.axis").transition().duration(750)
            .attr("class", "y axis")
            .call(yAxis);
        if(built==0) {
            built=1;
            x.domain(data.map(function (d) {
                return d.TSectors;
            }));

            svg.call(tip);

            var xxx=svg.append("g").transition().duration(750)
                .attr("class", "x axis")
                .attr("transform", "translate(0," + (height+1) + ")")
                .attr("id","BarX")
                .call(xAxis);
                xxx.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", "-.55em")
                .attr("transform", "rotate(-45)")
                .attr("stroke-width", 1)
                //.append("text")
                //.text("Department")
                //.attr("stroke-width", 1);
           //xxx
           //     .append("text")
           //     .attr("x", "95%")
           //     .attr("y", 10)
           //     .attr("dy", ".71em")
           //     .style("text-anchor", "end")
           //     .text("Department")
           //     .attr("stroke-width", 1);


            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Intensity")
                .attr("stroke-width", 1);

        }
        var bar = svg.selectAll(".bar").data(data,function(d){
            return d.TSectors;
        });
        bar.enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.TSectors); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d.Intensity); })
            .attr("height", function(d) { return height - y(d.Intensity); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);
        bar.exit().remove();
        bar.transition().duration(750)
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.TSectors); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d.Intensity); })
            .attr("height", function(d) { return height - y(d.Intensity); });
    });
}


function type(d) {
    d.Intensity = +d.Intensity;
    return d;
}
// Set the dimensions of the canvas / graph
var linemargin = {top: 30, right: 20, bottom: 30, left: 50},
    linewidth = 1000 - linemargin.left - linemargin.right,
    lineheight = 170 - linemargin.top - linemargin.bottom;

// Parse the date / time

// Set the ranges
var linex = d3.time.scale().range([0, linewidth]);
var liney = d3.scale.linear().range([lineheight, 0]);

// Define the axes
var linexAxis = d3.svg.axis().scale(linex)
    .orient("bottom").ticks(5);

var lineyAxis = d3.svg.axis().scale(liney)
    .orient("left").ticks(5);

// Define the line
var valueline = d3.svg.line()
    .x(function(d) { return linex(d.date); })
    .y(function(d) { return liney(d.intensity); });

// Adds the svg canvas
var chartsvg = d3.select("body").select("#linechart")
    .append("svg")
    .attr("width", linewidth + linemargin.left + linemargin.right)
    .attr("height", lineheight + linemargin.top + linemargin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + linemargin.left + "," + linemargin.top + ")");

var lineSvg = chartsvg.append("g");

var focus = chartsvg.append("g")
    .style("display", "none");

// Get the data

d3.csv("./data/linechartDetail/"+selectedCountry+".csv", function(error, data) {
    data.forEach(function(d) {
        d.date = parseDate(d.time);
        d.intensity = +d.intensity;
    });

    // Scale the range of the data
    linex.domain(d3.extent(data, function(d) { return d.date; }));
    liney.domain([0, d3.max(data, function(d) { return d.intensity; })]);

    // Add the valueline path.
    lineSvg.append("path")
        .attr("class", "chartline")
        .attr("d", valueline(data));

    // Add the linex Axis
    chartsvg.append("g")
        .attr("class", "linex axis")
        .attr("transform", "translate(0," + lineheight + ")")
        .call(linexAxis)
        .append("text")
        .attr("x", "95%")
        .attr("y", 10)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Year")
        .attr("stroke-width", 1);

    // Add the liney Axis
    chartsvg.append("g")
        .attr("class", "liney axis")
        .call(lineyAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Intensity")
        .attr("stroke-width", 1);

    // append the x line
    focus.append("line")
        .attr("class", "linex")
        .style("stroke", "blue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("y1", 0)
        .attr("y2", lineheight);

    // append the y line
    focus.append("line")
        .attr("class", "liney")
        .style("stroke", "blue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("x1", linewidth)
        .attr("x2", linewidth);

    // append the circle at the intersection
    focus.append("circle")
        .attr("class", "liney")
        .style("fill", "none")
        .style("stroke", "blue")
        .attr("r", 4);

    // place the value at the intersection
    focus.append("text")
        .attr("class", "y1")
        .style("stroke", "white")
        .style("stroke-linewidth", "3.5px")
        .style("opacity", 0.8)
        .attr("dx", 8)
        .attr("dy", "-.3em");
    focus.append("text")
        .attr("class", "y2")
        .attr("dx", 8)
        .attr("dy", "-.3em");

    // place the date at the intersection
    focus.append("text")
        .attr("class", "y3")
        .style("stroke", "white")
        .style("stroke-linewidth", "3.5px")
        .style("opacity", 0.8)
        .attr("dx", 8)
        .attr("dy", "1em");
    focus.append("text")
        .attr("class", "y4")
        .attr("dx", 8)
        .attr("dy", "1em");

    // append the rectangle to capture mouse
    chartsvg.append("rect")
        .attr("width", linewidth)
        .attr("height", lineheight)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove)
        .on("click", showtext);
    function showtext() {
        var x0 = linex.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        change(d.time);
    }
    function mousemove() {
        var x0 = linex.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        focus.select("circle.liney")
            .attr("transform",
                "translate(" + linex(d.date) + "," +
                liney(d.intensity) + ")");

        focus.select("text.y1")
            .attr("transform",
                "translate(" + linex(d.date) + "," +
                liney(d.intensity) + ")")
            .text(d.intensity);

        focus.select("text.y2")
            .attr("transform",
                "translate(" + linex(d.date) + "," +
                liney(d.intensity) + ")")
            .text(d.intensity);

        focus.select("text.y3")
            .attr("transform",
                "translate(" + linex(d.date) + "," +
                liney(d.intensity) + ")")
            .text(formatDate(d.date));

        focus.select("text.y4")
            .attr("transform",
                "translate(" + linex(d.date) + "," +
                liney(d.intensity) + ")")
            .text(formatDate(d.date));

        focus.select(".linex")
            .attr("transform",
                "translate(" + linex(d.date) + "," +
                liney(d.intensity) + ")")
            .attr("y2", lineheight - liney(d.intensity));

        focus.select(".liney")
            .attr("transform",
                "translate(" + linewidth * -1 + "," +
                liney(d.intensity) + ")")
            .attr("x2", linewidth + linewidth);
    }

});
