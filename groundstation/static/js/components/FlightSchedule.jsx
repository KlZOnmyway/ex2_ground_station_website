import React, { Component } from 'react';
import FlightScheduleList from './FlightScheduleList';
import AddFlightschedule from './AddFlightschedule';
import DeleteFlightschedule from './DeleteFlightschedule';

class FlightSchedule extends Component{
	constructor(){
		super();
		this.state = {
			empty: true,
			addFlightOpen: false,
			deleteFlightOpen: false,
			allflightschedules: [],
			queuedflightschedule: [],
			thisFlightscheduleCommands: [{'command': {'command_id': ''}, 'timestamp': null}],
			thisFlightscheduleId: null,
			availCommands: [{ commandName: 'ping', id: 1 },
  							{ commandName: 'get_hk', id: 2 }],
		}
		this.handleAddFlightOpenClick = this.handleAddFlightOpenClick.bind(this);
		this.handleDeleteFlightOpenClick = this.handleDeleteFlightOpenClick.bind(this);
		this.handleAddEvent = this.handleAddEvent.bind(this);
		this.addFlightschedule = this.addFlightschedule.bind(this);
		this.handleAddCommandClick = this.handleAddCommandClick.bind(this);
		this.handleEditCommandClick = this.handleEditCommandClick.bind(this);
	}

	componentDidMount(){
		fetch('/api/flightschedules?limit=5')
		.then(results =>{
			return results.json();
		}).then(data =>{
			console.log(data);
			if(data.status=='success'){
				console.log('success');
				this.setState({'allflightschedules': data.data.flightschedules, empty: false});
			}
		})
	}

	handleAddFlightOpenClick(event){
		event.preventDefault();
		event.stopPropagation();

		this.setState({
						addFlightOpen: !this.state.addFlightOpen,
						thisFlightscheduleCommands: [{'command': {'command_id': ''}, 'timestamp': null}],
					});
	};

	handleDeleteFlightOpenClick(event){
		event.preventDefault();
		event.stopPropagation();
		this.setState({deleteFlightOpen: !this.state.deleteFlightOpen});
	}

	addFlightschedule(event){
		event.preventDefault();
		let data = {is_queued: false, commands: this.state.thisFlightscheduleCommands}
		console.log('posted data', data);
		fetch('/api/flightschedules', {
			method: 'POST',
			headers: {
      		  'Content-Type': 'application/json'
      		},
      		body: JSON.stringify(data),	
		}).then(results => {
			return results.json();
		}).then(data => {
			console.log(data)

			if(data.status == 'success'){
				const obj = this.state.allflightschedules.slice();
				obj.push(data.data);
				this.setState({addFlightOpen: !this.state.addFlightOpen,
				thisFlightscheduleCommands: 
					[{'command': {'command_id': ''}, 'timestamp': ''}],
				allflightschedules: obj,})
			}
		});

	}

	handleAddEvent(event, type, idx){
		console.log(event)
		const obj = this.state.thisFlightscheduleCommands.slice();
		if(type=='date'){
			obj[idx].timestamp = event.toISOString();
		}else{
			obj[idx].command.command_id = event.value;
		}
		this.setState({thisFlightscheduleCommands: obj})
		console.log(this.state.thisFlightscheduleCommands);
	}

	handleAddCommandClick(event){
		const obj = this.state.thisFlightscheduleCommands.slice();
		obj.push({'command' : {'command_id': ''}, 'timestamp': null})
		this.setState({thisFlightscheduleCommands: obj})
	}

	handleEditCommandClick(event, idx){
		const obj = this.state.allflightschedules[idx].commands.slice()
		console.log(obj);
		this.setState({addFlightOpen: !this.state.addFlightOpen,
						thisFlightscheduleCommands: obj})
	}


	render(){
		return (
		    <div>
    		  <FlightScheduleList 
    		    flightschedule={this.state.allflightschedules} 
    		    isMinified={false}
    		    handleAddFlightOpenClick={this.handleAddFlightOpenClick}
    		    handleDeleteFlightOpenClick={this.handleDeleteFlightOpenClick}
    		    handleEditCommandClick={this.handleEditCommandClick}
    		    empty={this.state.empty}
    		  />
    		  <AddFlightschedule 
    		    open={this.state.addFlightOpen}
    			handleAddFlightOpenClick={this.handleAddFlightOpenClick}
    			handleAddEvent={this.handleAddEvent}
    			thisFlightschedule={this.state.thisFlightscheduleCommands}
    			availCommands={this.state.availCommands}
    			addFlightschedule={this.addFlightschedule}
    			handleAddCommandClick={this.handleAddCommandClick}
    		  />
    		  <DeleteFlightschedule
    		    open={this.state.deleteFlightOpen}
    		    handleDeleteFlightOpenClick={this.handleDeleteFlightOpenClick}
    		  />
  			</div>
		)
	}

} 

export default FlightSchedule;