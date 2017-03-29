/**
 * Created by RongJie on 12/3/16.
 */

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 9])
    .on("zoom", move);
var colorRange=d3.scale.linear().domain([0,5]).range(["#fbf1ea","#da7a35"]);

var width = document.getElementById('container').offsetWidth;
var height = width / 2;

var topo,projection,path,svg,g;

var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

var useGreatCircles = true;

var arc = d3.geo.greatArc().precision(10);

var countries, centroids, arcs, country,defs;

var nodeDataByCode = {}, links = [];

var year = 'Intensity';

var maxMagnitude;

var magnitudeFormat = d3.format(",.0f");

var arcNodes;

var arcWidth,arcColor;
var minColor = '#c2dff3';
var maxColor = '#1e6ca4';

var hideColor=1;

var topSource = d3.select("#topsource");
var topTarget = d3.select("#toptarget");

var sourceInten = d3.select("#sourceinten");
var targetInten = d3.select("#targetinten");

var selectCountry = d3.select("#countryname");


var hideArc=1;

setup(width,height);

d3.select(window).on("resize", throttle); //窗口改变的时候重新画图

d3.select(window).on('resize', resize);


//地图的准备工作,container和映射
function setup(width,height){
    projection = d3.geo.mercator()
        .translate([(width/2), (height/1.5)])
        .scale( width / 2 / Math.PI);

    path = d3.geo.path().projection(projection);

    svg = d3.select("#container").append("svg")
        .attr("id","mapsvg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom);
    //.append("g");

    g = svg.append("g");

    countries = g.append("g").attr("id", "countries");

    arcs = g.append("g").attr("id", "arcs");

    defs = g.append("svg:defs").attr("id","defs");
}


d3.csv("data/refugee-nodes.csv", function(err, capitals) {
    capitals.forEach(function(node) {
        node.coords = nodeCoords(node);
        node.projection = node.coords ? projection(node.coords) : undefined;
        nodeDataByCode[node.Name] = node;
    });
});

d3.json("data/world-topo-min.json", function(error, world) {
    topo = topojson.feature(world, world.objects.countries).features;
    draw(topo);
});


//画图
function draw(topo) {
    country = g.select("#countries")
        .selectAll(".country")
        .data(topo)
        .enter()
        .insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d,i) { return d.properties.name; })
        .on("click", function(d,i){click(d.country?d.country:d.properties.name)})
        .style("fill",'#fbf1ea')
        .style("stroke",'#fff');

    //tooltips
    var offsetL = document.getElementById('container').offsetLeft+10;
    var offsetT = document.getElementById('container').offsetTop-50;
    country.on("mousemove", function(d,i) {

            var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );

            var text;
            if(d.properties)
                text=d.properties.name;
            else
                text=d.country;
            tooltip.classed("hidden", false)
                .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
                .html(text);

        })
        .on("mouseout",  function(d,i) {
            tooltip.classed("hidden", true);
        });


    //offsets for tooltips
    //var offsetL = document.getElementById('container').offsetLeft+20;
    //var offsetT = document.getElementById('container').offsetTop+10;
}

function redraw() {
    width = document.getElementById('container').offsetWidth;
    height = width / 2;
    d3.select('svg').remove();
    setup(width,height);
    draw(topo);
}

//重新画图的时间控制
var throttleTimer;

function throttle() {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
        redraw();
    }, 200);
}

// zoom的时候地图的改变
function move() {
    var t = d3.event.translate;
    var s = d3.event.scale;
    zscale = s;
    var h = height/4;

    t[0] = Math.min(
        (width/height)  * (s - 1),
        Math.max( width * (1 - s), t[0] )
    );

    t[1] = Math.min(
        h * (s - 1) + h * s,
        Math.max(height  * (1 - s) - h * s, t[1])
    );

    zoom.translate(t);
    g.attr("transform", "translate(" + t + ")scale(" + s + ")");

    //adjust the country hover stroke width based on zoom level
    // country.style("stroke-width", 1.5 / s+"px");
}


function nodeCoords(node) {
    var lon = parseFloat(node.Lon);
    var lat = parseFloat(node.Lat);
    if (isNaN(lon) || isNaN(lat)) return null;
    return [lon, lat];
}

function click(name){
    arcNodes.attr("visibility", "hidden");
    var clickCode = nodeDataByCode[name].Code;
    var connectCountriesClass = "."+clickCode;
    var connectCountriesPath= arcs.selectAll(connectCountriesClass);

    if(hideArc==1){connectCountriesPath.attr("visibility", "visible");}

    var sourceCountriesData = links.filter(function(object){
        if (object.dest.Name == name){
            return true;
        }
    }).sort(function(a,b){
        return b.magnitude - a.magnitude;
    }).slice(0,3);

    var targetCountriesData = links.filter(function(object){
        if (object.origin.Name == name){
            return true;
        }
    }).sort(function(a,b){
        return b.magnitude - a.magnitude;
    }).slice(0,3);

    console.log(sourceCountriesData);
    console.log(targetCountriesData);
    var selectname =[name];

    var countryname = selectCountry.selectAll("p").data(selectname);
    countryname.enter().append('p').text(function(d){return d});
    countryname.exit().remove();
    countryname.transition().duration(100)
        .text(function(d){return d});

    var displaySource = topSource.selectAll("p").data(sourceCountriesData);
    displaySource.enter().append("p")
            .text(function(d,i){return "#"+(i+1)+" "+d.origin.Name});
    displaySource.exit().remove();
    displaySource.transition().duration(100)
            .text(function(d,i){return "#"+(i+1)+" "+d.origin.Name});

    var displaySourcedata = sourceInten.selectAll("p").data(sourceCountriesData);
    displaySourcedata.enter().append("p")
        .text(function(d,i){return magnitudeFormat(d.magnitude)});
    displaySourcedata.exit().remove();
    displaySourcedata.transition().duration(100)
        .text(function(d,i){return magnitudeFormat(d.magnitude)});

    var displayTarget = topTarget.selectAll("p").data(targetCountriesData);
    displayTarget.enter().append("p")
        .text(function(d,i){return  "#"+(i+1)+" "+d.dest.Name});
    displayTarget.exit().remove();
    displayTarget.transition().duration(100)
        .text(function(d,i){return  "#"+(i+1)+" "+d.dest.Name});

    var displayTargetdata = targetInten.selectAll("p").data(targetCountriesData);
    displayTargetdata.enter().append("p")
        .text(function(d,i){return magnitudeFormat(d.magnitude)});
    displayTargetdata.exit().remove();
    displayTargetdata.transition().duration(100)
        .text(function(d,i){return magnitudeFormat(d.magnitude)});

}

function change(date) {
    var url="data/crisis/crisis_"+date+".csv";
    d3.csv("data/crisis/crisis_"+date+".csv", function(error, data) {
        var c = g.selectAll(".country");
        data.sort(function(a, b) {
            return parseFloat(b.sum) - parseFloat(a.sum);
        });
        var top3=data.slice(0, 5);
        var worst_list=d3.select("body").select("#worst_list").selectAll("a").data(top3,function (d){
            return d.country;
        });//countryDetail
        worst_list.enter().append("a")
            .html(function (d) { return d.country+  "<br/>"; })
            .attr("class","topa")
            .attr("target","value")
            .attr("href", function (d){return "./countryDetail.html?country="+d.country+"&time="+date});
        worst_list.exit().remove();
        
        if(hideColor!=1){return}
        
        c.data(data, function(d) {
            return d.country? d.country: d.properties.name;
        }).transition().duration(300)
            .style("fill", function(d) { var x=colorRange(d.sum);
                return d.sum?colorRange(d.sum):'#fbf1ea' ;});
    });
}

function changeDate(date){
    var url="data/eventEdge/eventdata_"+date+".csv";
    d3.csv(url, function(err, events){
        links = [];
        maxMagnitude = d3.max(events, function(d) {
            return parseFloat(Math.abs(d[year]))});
        arcWidth = d3.scale.linear().domain([0, maxMagnitude]).range([.5, 7]);
        arcColor = d3.scale.log().domain([1, maxMagnitude]).range([minColor, maxColor]);

        events.forEach(function(flow) {
            if(nodeDataByCode[flow.SCountry] && nodeDataByCode[flow.TCountry]) {
                var o = nodeDataByCode[flow.SCountry]; // origin object
                var co = o.coords;
                var po = o.projection;

                var d = nodeDataByCode[flow.TCountry];
                var cd = d.coords;
                var pd = d.projection;
                var magnitude = parseFloat(Math.abs(flow[year])); //08年的移民数量

                if (co && cd && !isNaN(magnitude)) {
                    links.push({
                        source: co, target: cd,
                        magnitude: magnitude,
                        origin: o, dest: d,
                        originp: po, destp: pd
                    });
                }
            }
        });
        drawarc();
    });

}
function drawarc(){
    d3.select("#countryname").selectAll('p').remove();
    d3.select("#topsource").selectAll("p").remove();
    d3.select("#toptarget").selectAll("p").remove();
    d3.select("#sourceinten").selectAll("p").remove();
    d3.select("#targetinten").selectAll("p").remove();
    d3.select("#arcs").selectAll("path").remove();
    d3.select("#defs").selectAll("defs").remove();
    d3.select("#defs").selectAll("linearGradient").remove();
    var gradientNameFun = function(d) { return "grd"+d.origin.Code+d.dest.Code; };
    var gradientRefNameFun = function(d) { return "url(#"+gradientNameFun(d)+")"; };
    var strokeFun = function(d) { return arcColor(d.magnitude); };

    if(hideArc==0){return}

    defs.append("marker")
        .attr("id", "arrowHead")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 10)
        .attr("refY", 5)
        .attr("orient", "auto")
        //.attr("markerUnits", "strokeWidth")
        .attr("markerUnits", "userSpaceOnUse")
        .attr("markerWidth", 4*2)
        .attr("markerHeight", 3*2)
        .append("polyline")
        .attr("points", "0,0 10,5 0,10 1,5")
        .attr("fill", maxColor)
    ;
    var gradient = defs.selectAll("linearGradient")
        .data(links)
        .enter()
        .append("svg:linearGradient")
        .attr("id", gradientNameFun)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", function(d) {
            return d.originp[0]; })
        .attr("y1", function(d) { return d.originp[1]; })
        .attr("x2", function(d) { return d.destp[0]; })
        .attr("y2", function(d) { return d.destp[1]; })
        ;

    gradient.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", minColor)
        .attr("stop-opacity", .0);
    gradient.append("svg:stop")
        .attr("offset", "80%")
        .attr("stop-color", strokeFun)
        .attr("stop-opacity", 1.0);
    gradient.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", strokeFun)
        .attr("stop-opacity", 1.0);

    arcNodes = arcs.selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("class",function(d){ return d.origin.Code+' '+d.dest.Code})
        .attr("stroke", gradientRefNameFun)
        .attr("stroke-linecap", "round")
        .attr("stroke-width", function(d) { return arcWidth(d.magnitude); })
        .attr("d", function(d) {
            //if (useGreatCircles)
            //return splitPath(path(arc(d)));
            //else
            return path({
                type: "LineString",
                coordinates: [d.source, d.target]
            });
        })
        .sort(function(a, b) {
            var a = a.magnitude, b = b.magnitude;
            if (isNaN(a)) if (isNaN(b)) return 0; else return -1;
            if (isNaN(b)) return 1;
            return d3.ascending(a, b);
        });
    arcNodes.on("mouseover", function(d) {
        d3.select(this)
            // .attr("stroke", "red");
            .attr("marker-end", "url(#arrowHead)");
    });
    arcNodes.on("mouseout", function(d) {
        d3.select(this)
            .attr("marker-end", "none");
        // .attr("stroke", gradientRefNameFun);
    });
    arcNodes.append("g:title")
        .text(function(d) {
            return d.origin.Name+" -> "+d.dest.Name+"\n"+
                "Negative effect: " +magnitudeFormat(d.magnitude);
        });

}


// Set the dimensions of the canvas / graph
var linemargin = {top: 30, right: 20, bottom: 30, left: 50},
    linewidth = parseInt(d3.select("#chartsvg").style("width"))- linemargin.left - linemargin.right,
    lineheight = parseInt(d3.select("#chartsvg").style("height")) - linemargin.top - linemargin.bottom;

// Parse the date / time
var parseDate = d3.time.format("%Y-%m").parse,
    formatDate = d3.time.format("%Y-%b"),
    bisectDate = d3.bisector(function(d) { return d.date; }).left;

// Set the ranges
var x = d3.time.scale().range([0, linewidth]);
var y = d3.scale.linear().range([lineheight, 0]);

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

// Define the line
var valueline = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.sum); });

// Adds the svg canvas
var chartsvg = d3.select("body").select("#chart").select("#chartsvg")
    .attr("width", linewidth + linemargin.left + linemargin.right)
    .attr("height", lineheight + linemargin.top + linemargin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + linemargin.left + "," + linemargin.top + ")");

var lineSvg = chartsvg.append("g").attr("class","lineSvg");

var focus = chartsvg.append("g").attr("class","pointers")
    .style("display", "none");

// Get the data
d3.csv("data/time_crisis.csv", function(error, data) {
    data.forEach(function(d) {
        d.date = parseDate(d.time);
        d.sum = +d.sum;
    });

    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.sum; })]);

    // Add the valueline path.
    lineSvg.append("path")
        .attr("class", "chartline")
        .attr("d", valueline(data));

    // Add the X Axis
    chartsvg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + lineheight + ")")
        .call(xAxis).append("text")
        .attr("x", "94%")
        .attr("y", 10)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Year")
        .attr("stroke-width", 1);

    // Add the Y Axis
    chartsvg.append("g")
        .attr("class", "y axis")
        .call(yAxis).append("text")
        // .attr("transform", "rotate(-90)")
        .attr("x", -20)
        .attr("y", -15)
        .attr("dy", ".71em")
        .style("text-anchora", "end")
        .text("Global crisis number")
        .attr("stroke-width", 1);

    // append the x line
    focus.append("line")
        .attr("class", "x")
        .style("stroke", "#323232")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("y1", 0)
        .attr("y2", lineheight);

    // append the y line
    focus.append("line")
        .attr("class", "y")
        .style("stroke", "#323232")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("x1", linewidth)
        .attr("x2", linewidth);

    // append the circle at the intersection
    focus.append("circle")
        .attr("class", "y")
        .style("fill", "none")
        .style("stroke", "#323232")
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
        .attr("class","dashboard")
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove)
        .on("click", showtext);

    function showtext() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        change(d.time);
        changeDate(d.time);
    }

    function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        focus.select("circle.y")
            .attr("transform",
                "translate(" + x(d.date) + "," +
                y(d.sum) + ")");

        focus.select("text.y1")
            .attr("transform",
                "translate(" + x(d.date) + "," +
                y(d.sum) + ")")
            .text(d.sum);

        focus.select("text.y2")
            .attr("transform",
                "translate(" + x(d.date) + "," +
                y(d.sum) + ")")
            .text(d.sum);

        focus.select("text.y3")
            .attr("transform",
                "translate(" + x(d.date) + "," +
                y(d.sum) + ")")
            .text(formatDate(d.date));

        focus.select("text.y4")
            .attr("transform",
                "translate(" + x(d.date) + "," +
                y(d.sum) + ")")
            .text(formatDate(d.date));

        focus.select(".x")
            .attr("transform",
                "translate(" + x(d.date) + "," +
                y(d.sum) + ")")
            .attr("y2", lineheight - y(d.sum));

        focus.select(".y")
            .attr("transform",
                "translate(" + linewidth * -1 + "," +
                y(d.sum) + ")")
            .attr("x2", linewidth + linewidth);
    }

});

var Color = d3.scale.ordinal()
    .domain(["0","1","2","3","4","5","crises/","Month"])
    .range(["rgb(251, 241, 234)","rgb(243, 215, 194)","rgb(236,189,156)","rgb(230,168,123)","rgb(223,145,90)","rgb(217,123,60)","rgb(255,255,255)","rgb(255,255,255)"]);

var crisisLegend = svg.append('svg').attr("id","crisislegend");

crisisLegend.append("g")
    .attr("class", "legendLinear")
    .attr("transform", "translate(20,440)");

var legendLinear = d3.legend.color()
    .shapeWidth(30)
    .orient('horizontal')
    .scale(Color);

crisisLegend.select(".legendLinear")
    .call(legendLinear);

var eventLegend = crisisLegend.append("g").attr("id","eventlegend");
    eventLegend.append("image")
    .attr('x',-20)
    .attr('y',400)
    .attr('width', 250)
    .attr('height', 30)
    .attr("xlink:href","image/legend1.png");

eventLegend.append("text")
    .attr('x',20)
    .attr("y",418)
    .text("source");

eventLegend.append("text")
    .attr('x',165)
    .attr("y",418)
    .text("target");

function testcolor(){
    if(hideColor==0){
        g.selectAll(".country").transition().duration(300) .style("fill", function(d) {
            return d.sum?colorRange(d.sum):'#fbf1ea' ;});
        hideColor=1;
    }
    else if(hideColor==1){
        g.selectAll(".country").transition().duration(300) .style("fill", function(d) {
            return '#fbf1ea' ;});
        hideColor=0;
    }
}

function testarc(){
    if(hideArc==0){
        arcNodes.attr("visibility", "visible");
        hideArc = 1;

    }
    else if (hideArc == 1){
        arcNodes.attr("visibility", "hidden");
        hideArc =0;
    }
    drawarc();
}

function eventhide(){
    currentvalue = document.getElementById('eventhide').value;
    if(currentvalue == "Off"){
        document.getElementById("eventhide").value="On";
    }else{
        document.getElementById("eventhide").value="Off";
    }
    testarc();
}

function crisis(){
    currentvalue = document.getElementById('crisis').value;
    if(currentvalue == "Off"){
        document.getElementById("crisis").value="On";
    }else{
        document.getElementById("crisis").value="Off";
    }
    testcolor();
}

function resize() {
    var linewidth = parseInt(d3.select("#chartsvg").style("width")) - linemargin.left - linemargin.right,
        lineheight = parseInt(d3.select("#chartsvg").style("height")) - linemargin.top -linemargin.bottom;

    // Update the range of the scale with new width/height
    x.range([0, linewidth]);
    y.range([lineheight, 0]);

    // Update the axis and text with the new scale
    svg.select('.x.axis')
        .attr("transform", "translate(0," + lineheight + ")")
        .call(xAxis);

    svg.select('.y.axis')
        .call(yAxis);

}



