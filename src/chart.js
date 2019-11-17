import React from 'react';
import * as d3 from "d3";


class Chart extends React.Component {
    componentDidMount() {
        this.update();
    }


    update = () => {
        // Check if the chart component was rendered, if not the update func. will exit earlier. If it was rendered, update func. continue
        const chartComponentSelection = d3.select("#chart");
        if (chartComponentSelection.empty()) {return;}

        const { data } = this.props;

        const WIDTH = 800;
        const HEIGHT = 400;
        const margin = { top: 60, right: 60, bottom: 60, left: 60 };
        const width = WIDTH - margin.left - margin.right;
        const height = HEIGHT - margin.top - margin.bottom;

        // Clean previous graphic when an update is needed by removing the svg element
        const mainSvgSelection = d3.select("svg");
        if (!mainSvgSelection.empty()) {
            mainSvgSelection.remove();
        }

        data.sort(function(a, b) {
            return a.day - b.day;
        });

        // Scales
        const xScale = d3
            .scaleLinear()
            .domain(
                d3.extent(data, function(d) {
                    return d.day;
                })
            )
            .range([0, width]);

        const yScale = d3
            .scaleLinear()
            .domain(
                d3.extent(data, function(d) {
                    return d.delay;
                })
            )
            .range([height, 0]);

        // Line function for building the graphic for each "d" of data
        const line = d3
            .line()
            .x(function(d) {
                return xScale(d.day);
            })
            .y(function(d) {
                return yScale(d.delay);
            });

        const svg = chartComponentSelection
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr(
                "viewBox",
                "0 0 "
                    .concat(width + margin.left + margin.right)
                    .concat(" ")
                    .concat(height + margin.top + margin.bottom)
            )
            .classed("svg-content", true)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Title
        svg
            .append("text")
            .attr("class", "chartTitle")
            .attr("x", width / 2)
            .attr("y", 0 - margin.top / 2)
            .style("text-anchor", "middle")
            .text("Average delay (in minutes) in Los Angeles airport (per day)");

        // xAxis
        svg
            .append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale))
            .append("text")
            .attr("class", "chartXAxisLabel")
            .attr("x", width)
            .attr("dy", "-0.5em")
            .attr("text-anchor", "end")
            .text("Days");


        // yAxis
        svg
            .append("g")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("class", "chartYAxisLabel")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.5em")
            .attr("text-anchor", "end")
            .text("Average Delay (minutes)");

        // Horizontal lines in background
        svg
            .selectAll(".horizontalGrid")
            .data(yScale.ticks(10))
            .enter()
            .append("line")
            .attr("class", "horizontalGrid")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", function(d) {
                return yScale(d);
            })
            .attr("y2", function(d) {
                return yScale(d);
            });

        // Main line
        svg
            .append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        function addTooltip() {
            const tooltip = svg
                .append("g")
                .attr("id", "tooltip")
                .style("display", "none");

            // External light blue circle
            tooltip
                .append("circle")
                .attr("fill", "#CCE5F6")
                .attr("r", 10);

            // Inner blue circle
            tooltip
                .append("circle")
                .attr("fill", "#3498db")
                .attr("stroke", "#fff")
                .attr("stroke-width", "1.5px")
                .attr("r", 4);

            // Frame for day and delay values
            tooltip
                .append("polyline")
                .attr("points", "0,0 0,25 55,25 60,45 65,25 170,25 170,0 0,0")
                .style("fill", "#fafafa")
                .style("stroke", "#3498db")
                .style("opacity", "0.9")
                .style("stroke-width", "1")
                .attr("transform", "translate(-60, -55)");

            const text = tooltip
                .append("text")
                .style("font-size", "13px")
                .style("font-family", "Segoe UI")
                .style("color", "#333333")
                .style("fill", "#333333")
                .attr("transform", "translate(-50, -40)");

            // Day value
            text
                .append("tspan")
                .attr("dx", "-10")
                .attr("id", "tooltip-day");

            // "Delay : " positioning
            text
                .append("tspan")
                .style("fill", "green")
                .attr("dx", "5")
                .text("Delay : ");

            // Delay value
            text
                .append("tspan")
                .attr("id", "tooltip-delay")
                .style("font-weight", "bold");

            return tooltip;
        }

        // Find the closest position of the mouse
        const bisectDate = d3.bisector(function(d) {
            return d.day;
        }).left;

        function mousemove() {
            const x0 = xScale.invert(d3.mouse(this)[0]);
            const i = bisectDate(data, x0);
            const d = data[i];

            if (d) {
                tooltip.attr("transform", "translate(" + xScale(d.day) + "," + yScale(d.delay) + ")")
                d3.select("#tooltip-day").text(`${d.day}. day `);
                d3.select("#tooltip-delay").text(`${d.delay} minutes`);
            }
        }

        const tooltip = addTooltip();

        svg
            .append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)

            .on("mouseover", function() {
                tooltip.style("display", null);
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            })
            .on("mousemove", mousemove);
    };

    render() {
        this.update();
        return (
            <div className="flexCenter">
                <div id="chart" className="svg-container" />
            </div>
        );
    }
}

export default Chart;