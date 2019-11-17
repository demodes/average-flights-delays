import * as Papa from 'papaparse';
import React from 'react';
import './App.css';
import LineChart from './chart';
import dataCSV from './1989.csv'; // download: http://stat-computing.org/dataexpo/2009/1989.csv.bz2


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flightsNotCancelled: [],
      avgDailyDelays: [],
      isArrivalDelay: true
    };
    this.toggleDelayType = this.toggleDelayType.bind(this);
  };


  componentDidMount() {
    this.getData();
  }


  // Transform date into day in the year; "1989,1,5" return value: 5
  dayInYear(date) {
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
  };


  async getData() {
    const response = await fetch(dataCSV);
    const reader = response.body.getReader();
    const result = await reader.read(); // raw array
    const decoder = new TextDecoder('utf-8');
    const csv = decoder.decode(result.value); // the csv text
    const results = Papa.parse(csv, { header: true }); // object with { data, errors, meta }
    const flights = results.data; // array of objects
    const flightsNotCancelled = flights.filter((item, index) => item.Cancelled === "0");
    this.setState({flightsNotCancelled: flightsNotCancelled});
    this.calculateAvgDelayPerDay();
  }


  calculateAvgDelayPerDay() {
    const flights = this.state.isArrivalDelay
        ? this.state.flightsNotCancelled.filter((flight) => flight.Dest === "LAX")
        : this.state.flightsNotCancelled.filter((flight) => flight.Origin === "LAX");
    if (flights.length < 1)  {return this.getData()}

    // We should use Arrival Delay for flights coming to LAX and Departure Delay for flights leaving the LAX
    const delayType = this.state.isArrivalDelay ? "ArrDelay" : "DepDelay";

    // Array with delay and date converted to day in the year; [delay, dayInYear]
    const flightsWithCountedDaysIntoYear = flights.map((flight) => [flight[delayType], this.dayInYear(new Date(`${flight.Year},${flight.Month},${flight.DayofMonth}`))]);
    let avgDailyDelays = [];

    for (let i = 1; i < 32; i++) {
      // All delays per particular day, possitive delays are excluded; [delayPerParticularDay, delayPerParticularDay, ...]
      let allDelaysPerDay = flightsWithCountedDaysIntoYear.filter((flightDelayAndDay) => (flightDelayAndDay[1] == i) && (flightDelayAndDay[0] > 0)).map(flightDelayAndDay => flightDelayAndDay[0]);
      let dailyDelaySum = allDelaysPerDay.reduce((accumulator, delay) => accumulator + parseInt(delay) , 0 );
      avgDailyDelays.push({day: i, delay: Math.round(dailyDelaySum / allDelaysPerDay.length)});
    }
    this.setState({avgDailyDelays: avgDailyDelays});
  }


  toggleDelayType() {
    this.setState({
      isArrivalDelay: !this.state.isArrivalDelay
    }, () => this.calculateAvgDelayPerDay());
  }


  render() {
    return (
        <div className="app">
          <LineChart data={this.state.avgDailyDelays}/>
          <div className="flexCenter">
            <div className="flexColumn">
              <div className="delayTypeInfoWrapper"><p>Selected Delay Type: <span className="delayTypeInfo">{this.state.isArrivalDelay ? "Arrival Delay" : "Departure Delay"}</span></p></div>
              <div><button className="chButton" onClick={this.toggleDelayType} type="button">Change Delay Type</button></div>
            </div>
          </div>
        </div>
    )
  }
}

export default App;
