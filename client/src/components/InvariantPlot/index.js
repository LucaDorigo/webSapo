import React, { Component } from "react";
import * as math from "mathjs";
import styles from "./style.module.css";
import { deepCopy } from "../../constants/global";

import Plotly from 'plotly.js-gl3d-dist-min'
import createPlotlyComponent from 'react-plotly.js/factory';
import { toast } from 'react-toastify';

import { tasks } from "../../constants/global";

const TimeAxisValue = "!webSapo_Time";

var http = require("http");

const Plot = createPlotlyComponent(Plotly);

type Props = {};

function getOption(prefix, item, selected_cond)
{
	if (selected_cond) {
		return (
			<>
				<option key={prefix + "option" + item} value={item}  selected="selected">{item}</option>
			</>
		);
	}

	return (
		<>
			<option key={prefix + "option" + item} value={item}>{item}</option>
		</>
	);
}

function name_if_valid(property, pos, alternative=undefined)
{
	if (property.length>pos) {
		return property[pos];
	}

	return alternative;
}

function getInitialCamera() {
	return {
			 center: {x: 0, y:0 ,z: 0},
			 eye: {x: -1.25, y: -1.25, z: 1.25},
			 up: {x: 0, y: 0, z: 1}
		   };
}

function buildArray(length, default_value = 0) {
	let array = [];
	for (var i=0; i<length; i++) {
		array.push(default_value);
	}

	return array;
}

function hasManyPSets(sapoResults)
{
	return sapoResults !== undefined && sapoResults.data.length > 1;
}

/*
function approx_fp_vertices(input, decimal=6)
{
	if (Array.isArray(input)) {
		let output = [];

		input.forEach((elem) => {
			output.push(approx_fp_vertices(elem));
		});

		return output;
	}

	if (typeof(input) === "number") {
		return Number(input.toFixed(decimal));
	}

	throw new TypeError("Unsupported type")
}
*/

function getFlowpipesBoundingBox(flowpipes, expand_ratio=0.10) 
{
	var dims = ['x', 'y', 'z'];

	var bbox = {};

	flowpipes.forEach((flowpipe) => {
		flowpipe.forEach((poly_union) => {
			poly_union.forEach((polytope) => {
				for (var dim of dims) {
					if (dim in polytope) {
						let polytope_min = Math.min(...polytope[dim])
						let polytope_max = Math.max(...polytope[dim])

						if (dim in bbox) {
							bbox[dim][0] = Math.min(polytope_min, bbox[dim][0]);
							bbox[dim][1] = Math.max(polytope_max, bbox[dim][1]);
						} else {
							bbox[dim] = [polytope_min, polytope_max];
						}
					}
				}
			});
		});
	});

	let max_precision = 9;

	for (let dim of dims) {
		if (dim in bbox) {
			var expand_size = (bbox[dim][1]-bbox[dim][0])*expand_ratio/2;
			expand_size += Math.pow(10, -max_precision);
			bbox[dim][0] = Number((bbox[dim][0] - expand_size).toFixed(max_precision));
			bbox[dim][1] = Number((bbox[dim][1] + expand_size).toFixed(max_precision));
		}
	}

	return bbox;
}

export default class InvariantPlot extends Component<Props> {

	constructor(props) {
		super(props);

		this.state = {
			plottable: [],            	  // plottable polytopes
			invariant: JSON.parse("[{\"x\":[0.0728863, 0.4493877, 0.4493877, 0.0728863, 0.0728863],\"y\":[0.013416600000000002, 0.013416600000000002, 0.2130754, 0.2130754, 0.013416600000000002],\"mode\":\"lines+markers\",\"type\":\"scatter\",\"fill\":\"toself\",\"color\":\"#51f542\",\"hoverinfo\":\"x+y\",\"line\":{\"color\":\"#51f542\",\"width\":0},\"marker\":{\"size\":1}}]"),
			selected: [],             	  // polytopes filtered by pset_selection
			animFrames: [],               // frames for reachability animation
			current_frame: 0,			  // index of the current frame
			slider_steps: [],             // the slider steps for reachability animation
			camera:	getInitialCamera(),   // camera object for 3D plots (see Plotly.scene.camera)			   		   
			animate: true,                // a Boolean flag for reachability animation
			selection_text: "",           // the text describing the parameter set selection
			pset_selection: [],           // a Boolean filter for plottable
			pset_selection_error: false,  // a Boolean flag signaling an error on the last selection
			colors: [],                   // colors for plottable
			pset_distinction: false,      // a Boolean flag for distinguishing parameter set data
			typingTimeout: 0,             // a timeout for the parameter set selector
			changed: false,               // a Boolean flag for changes
			chartType: "2D",              // chart type, i.e., either "2D" or "3D"
			dataType: "flowpipe",     	  // data type, i.e., either "flowpipe", "parameter set", or "k-induction proof"
			axes: { x: undefined,         // axis names
			        y: undefined, 
					z: undefined },
			plot_bbox: {},				  // the bounding box of the plot
			plot_frame: {}                // the frame of the plot
		};
	}

	render()
	{
		if (this.props.sapoResults === undefined && this.state.plottable.length>0) {
			this.setUnplottable();

			return null;
		}

		if (!(typeof(this.props.sapoResults) === "object" && "task" in this.props.sapoResults &&
			 (this.props.sapoResults.task === "invariant validation"))) {
			return null;
		}

		return (
			<>
				<div className={styles.left_chart}>
					<Plot
						data = {this.plotData()}
						frames={this.state.animFrames}
						layout={{
							/* to remove title space */
							margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
							autosize: true,
							showlegend: false,
							xaxis: { 
								title: { text: (this.state.axes.x === TimeAxisValue ? "Time": this.state.axes.x)},
								autorange: false, //!this.plottingAnimation(),
								range: this.state.plot_frame.x
							 },
							yaxis: { 
								title: { text: this.state.axes.y },
								autorange: false, //!this.plottingAnimation(),
								range: this.state.plot_frame.y
							},
							scene: {
								xaxis: { 
									title: {
										text: (this.state.axes.x === TimeAxisValue ? "Time": this.state.axes.x),
										/*font: {
											family: 'Computer Modern Roman',
											size: 20,
											//color: '#ff8f00'
										}*/
									},
									autorange: false, //!this.plottingAnimation(),
									range: this.state.plot_frame.x
								},
								yaxis: { 
									title: {
										text: this.state.axes.y,
										/*font: {
											family: 'Computer Modern Roman',
											size: 20,
											//color: '#ff8f00'
										}*/
									},
									autorange: false, //!this.plottingAnimation(),
									range: this.state.plot_frame.y
								},
								zaxis: { 
									title: {
										text: this.state.axes.z,
										/*font: {
											family: 'Computer Modern Roman',
											size: 20,
											//color: '#ff8f00'
										}*/
									},
									autorange: false, //!this.plottingAnimation(),
									range: this.state.plot_frame.z
								},
								camera: this.state.camera
							},
							updatemenus: (this.plottingAnimation() ? [{
								x: 0.1,
								y: 0,
								yanchor: "top",
								xanchor: "right",
								showactive: false,
								direction: "left",
								type: "buttons",
								pad: {"t": 67, "r": 10},
								buttons: [{
										method: "animate",
										args: [null, 
											{
												fromcurrent: true,
												transition: {
													duration: 0,
												},
												frame: {
													duration: 100
												}
											}
										],
										label: "Play"
									}, {
										method: "animate",
										args: [[null],
											{
												mode: "immediate",
												transition: {
												duration: 0
												},
												frame: {
												duration: 0
												}
											}
										],
										label: "Pause"
									}
								]
							}]:[]),
							sliders: (this.plottingAnimation() ? [{
								active: this.state.current_frame,
								steps: this.state.slider_steps,
								x: 0.1,
								len: 0.9,
								xanchor: "left",
								y: 0,
								yanchor: "top",
								pad: {t: 60, b: 10},
								currentvalue: {
									visible: false,
								},
								transition: {
									duration: 0,
									easing: "cubic-in-out"
								}
							}]:[])
						}}
						useResizeHandler={true}
						style={{width: '100%', height: '80vh'}}
						config={{responsive: true,
								 /* TODO: add a button to save a video
								  modeBarButtonsToAdd: 
										(this.state.chartType === '3D' ? [[{
											name: 'save camera',
											icon: Plotly.Icons.movie,
											click: function(gd) {
												var images = []

												gd.on('plotly_animated', () => {
													Plotly.toImage(gd).then((img) => {
														images.push(img)
													})
												})

												Plotly.animate(gd)

												// join PNGs in a video
											}
										}]] : []),*/
								 modeBarButtonsToRemove: 
										(this.state.chartType === '3D' ? ['resetCameraDefault3d', 'resetCameraLastSave3d'] :
										['autoScale2d', 'resetScale2d']),
								 toImageButtonOptions: {
									format: 'png', // one of png, svg, jpeg, webp
									filename: (this.props.projectName !== undefined ? this.props.projectName : 'webSapo') + "_image",
									height: 1000,
									width: 2000,
									scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
							     }
  						       }}
						onDoubleClick={() => {
							this.updatePlot();
						}}
						onRelayout={(layout) => { if ('scene.camera' in layout) {
								// here using setState bring me back to frame 0
								this.setState({camera: layout['scene.camera']});
							}
							let plot_frame = this.state.plot_frame;
							if ("xaxis.range[0]" in layout) {
								plot_frame.x = [layout["xaxis.range[0]"], 
											    layout["xaxis.range[1]"]] 
							}
							if ("yaxis.range[0]" in layout) {
								plot_frame.y = [layout["yaxis.range[0]"], 
											    layout["yaxis.range[1]"]] 
							}
							if ("zaxis.range[0]" in layout) {
								plot_frame.z = [layout["zaxis.range[0]"], 
											    layout["zaxis.range[1]"]] 
							}
							this.setState({plot_frame: plot_frame}, ()=>{
								this.updateInvariantPolytopes();
							});
						}}
						onAnimatingFrame={(frame) => {
							//this.setState({current_frame: parseInt(frame.name)});
						}}
					/>
				</div>
				<div className={styles.right_controls}>
					{ this.props.sapoResults.task === "invariant validation" && <div className={styles.result}>
						<p>{this.props.sapoResults.result}</p>
					</div>}
						{(this.hasParamData() || this.hasProofData()) && <div className={styles.radio_group} onChange={e => this.changeDataType(e)}>
						<div className={styles.radio_element}>
							<input type="radio" defaultChecked={this.plottingFlowpipe()} value="flowpipe" name="dataType" disabled={this.state.changed}/> Reachability
						</div>
						{this.hasProofData() && <div className={styles.radio_element}>
							<input type="radio" defaultChecked={this.plottingProof()} value="k-induction proof" name="dataType" disabled={this.state.changed}/> Proof
						</div>}
						{!this.hasProofData() && <div className={styles.radio_element}>
							<input type="radio" defaultChecked={this.plottingParameterSet()} value="parameter set" name="dataType" disabled={this.state.changed}/> Parameters
						</div>}
					</div>} {/*closing radio group*/}
					{ this.props.sapoResults.task !== "invariant validation" && <div className={styles.radio_group} onChange={e => this.changeCharType(e)}>
						<div className={styles.radio_element}>
							<input type="radio" defaultChecked={this.state.chartType === "2D"} value="2D" label="2D" name="dimensions" disabled={this.state.changed}/> 2D
						</div>
						<div className={styles.radio_element}>
							<input type="radio" defaultChecked={this.state.chartType === "3D"} value="3D" label="3D" name="dimensions" disabled={this.state.changed}/> 3D
						</div>
					</div>}
					{/*closing radio group*/}
					{ (this.plottingFlowpipe() || this.plottingProof()) && <div className={styles.radio_group}>
						<div className={styles.radio_element}>
							<input id="animation" type="checkbox" value="animation" defaultChecked={this.plottingAnimation()}  onChange={e => this.changeAnimation(e)} disabled={this.state.changed}/> Flowpipe animation
						</div>
					</div>} {/*closing checkbox group*/}
					{ hasManyPSets(this.props.sapoResults) && <div className={styles.radio_group}>
						<div className={styles.radio_element}>
							<input id="multicolor" type="checkbox" value="distinguish" defaultChecked={(this.state.pset_distinction ? "true" : "false")} onChange={e => this.changeDistinguish(e)}/> Distinguish parameter set data 
						</div>
					</div>} {/*closing checkbox group*/}
					{this.state.pset_distinction && <div className={this.psetSelectorClasses()}>
						<div>
							<div>
								<label for="pset-selector">Select parameter sets</label>
							</div>
							<div>
								<input id="pset-selector" type="text" placeholder="e.g., '2-4, 6'" value={this.state.selection_text} onChange={e => this.changedPSetSelector(e)}/>
							</div>
						</div>
					</div>} {/*closing text group*/}
					<div className={styles.selects}>
						<div className={styles.selectRow}>
							<p className={styles.selectLabel}>X axis:</p>
							<select name="xAxis" onChange={e => { this.changeAxis('x', e.target.value); }} className={styles.select} disabled={this.state.changed}>
								{(this.plottingFlowpipe() && this.props.sapoResults.task !== "invariant validation")&& 
									<option value={TimeAxisValue}>Time</option> }
								{(this.plottingFlowpipe() || this.plottingProof()) && this.props.sapoResults.variables.map((item, index) => {
									return getOption('x', item, index===0);
								})}
								{this.plottingParameterSet() && this.props.sapoResults.parameters.map((item, index) => {
									return getOption('x', item, index===0);
								})}
							</select>
						</div>
						<div className={styles.selectRow}>
							<p className={styles.selectLabel}>Y axis:</p>
							<select name="yAxis" onChange={e => { this.changeAxis('y', e.target.value); }} className={styles.select} disabled={this.state.changed}>
								{(this.plottingFlowpipe() || this.plottingProof()) && this.props.sapoResults.variables.map((item, index) => {
									return getOption('y', item, index===1);
								})}
								{this.plottingParameterSet() && this.props.sapoResults.parameters.map((item, index) => {
									return getOption('y', item, index===1);
								})}
							</select>
						</div>
						{this.state.chartType === "3D" && 
						<div className={styles.selectRow}>
							<p className={styles.selectLabel}>Z axis:</p>
							<select name="zAxis" onChange={e => { this.changeAxis('z', e.target.value); }} className={styles.select} disabled={this.state.changed}>
								{(this.plottingFlowpipe() || this.plottingProof()) && this.props.sapoResults.variables.map((item, index) => {
									return getOption('z', item, index===2);
								})}
								{this.plottingParameterSet() && this.props.sapoResults.parameters.map((item, index) => {
									return getOption('z', item, index===2);
								})}
							</select>
						</div>}
					</div>
				</div> {/*closing right controls*/}
			</>
		);
	}

	addBoundariesToPoly(poly, axis, interval)
	{
		let axis_index = this.props.sapoResults.variables.indexOf(axis);
		let array = buildArray(this.props.sapoResults.variables.length);

		array[axis_index] = -1;
		poly.A.push(JSON.parse(JSON.stringify(array)));
		array[axis_index] = 1;
		poly.A.push(array);

		poly.b.push(-interval[0]);
		poly.b.push(interval[1]);
	}

	updateInvariantPolytopes()
	{
		if (!("x" in this.state.plot_frame)) {
			return
		}

		let inv_polytope = JSON.parse(JSON.stringify(this.props.sapoResults.invariant));

		this.addBoundariesToPoly(inv_polytope, this.state.axes.x, this.state.plot_frame.x)
		this.addBoundariesToPoly(inv_polytope, this.state.axes.y, this.state.plot_frame.y)
		if (this.state.chartType === "3D") {
			this.addBoundariesToPoly(inv_polytope, this.state.axes.z, this.state.plot_frame.z)
		}

		this.computeVertices([inv_polytope], "polytope union", undefined,(vertices) => {
			let invariant = [];
			let polytope_gen;

			if (this.state.chartType === "2D") {
				polytope_gen = get2DPolygon;
			} else {
				polytope_gen = get3DPolytope;
			}

			for (var i=0; i<vertices.length; i++) {
				let polytope = polytope_gen(vertices[i], "#51f542", "Candidate invariant");
				if (polytope !== null) {
					invariant.push(polytope);
				}
			}

			this.setState({invariant: invariant});

			if (this.plottingAnimation()) {
				this.updateInvariantInAnimation(invariant);
			}
		})

	}

	dataFromInvariantValidation()
	{
		return (this.props.sapoResults !== null && "task" in this.props.sapoResults &&
				this.props.sapoResults.task === tasks.invariant_validation);
	}

	setPolytopesPlot(polytopes)
	{
		if (this.plottingParameterSet()) {
			this.setParamPlot(polytopes);
			return;
		}
		if (this.state.animate) {
			this.setAnimPlot(polytopes);
			return;
		}
		
		this.setReachPlot(polytopes);
	}

	getPolytopeDefaultColor()
	{
		if (this.dataFromInvariantValidation()) {
			if (this.plottingFlowpipe()) {
				return this.state.colors[0];
			}
			if (this.plottingProof()) {
				return this.state.colors[1];
			}
		}

		return undefined;
	}

	verticesToPolytopes(data_vertices, dataType, from_invariant_validation = false)
	{
		if (dataType === "parameter set") {
			return this.getParameterSet(data_vertices);
		}

		let color = undefined;
		let labelling_function = (time) => { return undefined };

		if (dataType === "flowpipe") {
			labelling_function = (time) => {
				return "T_"+time
			}
			if (from_invariant_validation) {
				color = this.state.colors[0];
			}
		}
		if (dataType === "k-induction proof") {
			labelling_function = (time) => {
				if (time === 0) {
					return "CI"
				}
				return "F(F^"+(time-1)+"_{CI}(CI))"
			}
			if (from_invariant_validation) {
				color = this.state.colors[1];
			}
		}

		return this.getReachSet(data_vertices, color, labelling_function);
	}

	updatePlot()
	{
		if (this.plottingProof()) {

			this.computeVertices(this.props.sapoResults.data, "parametric flowpipe", 
								 this.state.dataType, (vertices) => {
				let polytopes = this.verticesToPolytopes(vertices, this.state.dataType,
														 true);

				this.computeVertices(this.props.sapoResults.data, "parametric flowpipe", 
									 "flowpipe", (vertices) => {
					let fp_polytopes = this.verticesToPolytopes(vertices, "flowpipe", true);

					let reachability = [];
					
					fp_polytopes.forEach((poly, j) => {
					
						poly.forEach((poly_array, i) => {
							reachability = reachability.concat(poly_array);
						});

						polytopes[j].forEach((poly_array, i) => {
							polytopes[j][i] = poly_array.concat(reachability);
						});
					});

					this.setPolytopesPlot(polytopes);

					this.updateInvariantPolytopes();
				});
				
			});

			return;
		}

		this.computeVertices(this.props.sapoResults.data, "parametric flowpipe", 
							 this.state.dataType, (vertices) => {
			let polytopes = this.verticesToPolytopes(vertices, this.state.dataType,
													 this.dataFromInvariantValidation());
			this.setPolytopesPlot(polytopes);

			this.updateInvariantPolytopes();
		});
	}

	computeVertices(input_data, what, field, triggeredFunction)
	{
		let query_obj = {
			data: input_data,
			what: what,
			field: field
		};
		if (field === "parameter set") {
			query_obj["axes"] = this.getProjSubspace(this.props.sapoResults.parameters);
		} else {
			query_obj["axes"] = this.getProjSubspace(this.props.sapoResults.variables);
		}

		let query = JSON.stringify(query_obj);
		const options = {
			hostname: window.location.hostname,
			port: process.env.REACT_APP_SERVER_PORT,
			path: '/polyproject',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': query.length
			}
		}

		const req = http.request(options, (res) => {
			let JSON_msg = '';
			res.on('data', (dmsg) => {
				JSON_msg += dmsg
			});

			res.on('end', () => {
				let msg = JSON.parse(JSON_msg);

				if (msg.stderr === "") {
					let data_vertices =  JSON.parse(msg.stdout);
					triggeredFunction(data_vertices);
				} else {
					/*
					toast.error(msg.stderr);
					this.setState({
						changed: false
					});
					*/
					console.log(msg.stderr);
				}
			});
		}).on('error', (error) => {
			toast.error(error);
			this.setState({
				changed: false
			});
		});
		req.write(query);
		req.end();
	}

	changeAxis(axis_name, value)
	{
		var axes = this.state.axes;
		axes[ axis_name ] = value;
		this.setState({ 
			axes: axes,
			changed: true
		}, ()=>{
			this.updatePlot();
		});
	}

	plottingFlowpipe()
	{
		return this.props.sapoResults !== undefined && this.state.dataType === "flowpipe";
	}

	plottingParameterSet()
	{
		return this.props.sapoResults !== undefined && this.state.dataType === "parameter set";
	}

	plottingProof()
	{
		return this.props.sapoResults !== undefined && this.state.dataType === "k-induction proof";
	}

	plottingAnimation()
	{
		return (this.plottingFlowpipe() || this.plottingProof()) && this.state.animate
	}

	hasData(name)
	{
		return (this.props.sapoResults !== undefined && this.props.sapoResults.data.length > 0 && name in this.props.sapoResults.data[0]);
	}

	hasReachData()
	{
		return this.hasData('flowpipe');
	}

	hasParamData()
	{
		return this.hasData('parameter set');
	}

	hasProofData()
	{
		return this.hasData('k-induction proof');
	}

	getAxisNames(dataType)
	{
		var axis_names = {};

		var dims;
		if (dataType === "flowpipe" || dataType === "k-induction proof") {
			dims = this.props.sapoResults.variables;
		} else {
			dims = this.props.sapoResults.parameters;
		}

		axis_names.x = name_if_valid(dims, 0);
		axis_names.y = name_if_valid(dims, 1, axis_names.x);
		axis_names.z = name_if_valid(dims, 2, axis_names.x);

		return axis_names;
	}

	changeDataType(e)
	{
		this.setState({axes: this.getAxisNames(e.target.value),
					   dataType: e.target.value,
					   changed: true }, 
					   ()=>{
						 this.updatePlot();
					   });
	}
	
	changeCharType(e)
	{
		this.setState({ chartType: e.target.value, changed: true}, 
			()=>{
			  this.updatePlot();
			});
	}

	changeAnimation(e)
	{
		if (this.plottingFlowpipe() || this.plottingProof()) {
			this.setState({ animate: e.currentTarget.checked, changed: true },
				() => {
					if (this.plottingAnimation()) {
						this.setAnimPlot(this.state.plottable);
					} else {
						this.setReachPlot(this.state.plottable);
					}
				});
		} else {
			this.setState({ animate: e.currentTarget.checked, changed: true },
				() => {
					this.updatePlot();
				});
		}
	}

	createColors(distinct)
	{
		if (this.dataFromInvariantValidation()) {
			return ['#d62728', 		// flowpipe color
					'#2870ed', 		// proof color
					'#51f542' 		// candidate invariant color
				];
		}

		if (distinct) {

			// many colors
			return getDistinctColors(this.props.sapoResults.data.length);
		}
		
		// single color
		var color = getDistinctColors(1)[0];

		var colors = [];
		for (let i=0; i<this.props.sapoResults.data.length; i++) {
			colors.push(color);
		}

		return colors;
	}

	changeDistinguish(e)
	{
		let selection;

		if (e.currentTarget.checked) {
			selection = this.parseSelected(this.state.selection_text);
		} else {
			selection = this.parseSelected("");
		}

		this.setState({ 
			pset_distinction: e.currentTarget.checked, 
			colors: this.createColors(e.currentTarget.checked),
			changed: true
		}, () => {
			this.updateSelection(selection);
		});
	}

	parseSelected(sel_text) {
		var selection = [];

		if (sel_text==="") {
			for (let i=0; i< this.props.sapoResults.data.length; i++) {
				selection.push(true);
			}
			return selection;
		}

		for (let i=0; i< this.props.sapoResults.data.length; i++) {
			selection.push(false);
		}

		var blocks = sel_text.replace(/\s/g,'').split(',');
		var boundaries;
		for (let block of blocks) {
			if (isNaN(block)) {
				boundaries = block.split('-');
				if (boundaries.length !== 2 || isNaN(boundaries[0]) || boundaries[1]==="" || isNaN(boundaries[1])) {
					return undefined;
				}
				boundaries = [parseInt(boundaries[0]), parseInt(boundaries[1])]
			} else {
				boundaries = [parseInt(block), parseInt(block)]
			}

			if (boundaries[0]>boundaries[1] || boundaries[0]<0 || boundaries[1]>=selection.length) {
				return undefined;
			}

			for (let i=boundaries[0]; i<=boundaries[1]; i++) {
				selection[i] = true;
			}
		}

		return selection;
	}

	psetSelectorClasses()
	{
		if (this.state.pset_selection_error) {
			return `${styles.input_text_group} ${styles.error}`;
		}
		return styles.input_text_group;
	}

	updateSelected()
	{
		if (this.plottingAnimation()) {
			this.setAnimPlot(this.state.plottable);
		} else {
			if (this.plottingFlowpipe()) {
				this.setReachPlot(this.state.plottable);
			} else {
				this.setParamPlot(this.state.plottable);
			}
		}
	}

	updateSelection(selection)
	{
		if (selection !== undefined) {
			this.setState({
				pset_selection: selection, 
				pset_selection_error: false,
				changed: true
			}, () => {
				this.updateSelected();
			});
		} else {
			toast.error("Wrong selection");
			this.setState({ 
				pset_selection_error: true 
			}); 
		}
	}

	changedPSetSelector(e)
	{
		// Changes selection only after 1.5 seconds after the user stops writing
		if (this.state.typingTimeout) {
       		clearTimeout(this.state.typingTimeout);
    	}

		this.setState({
			selection_text: e.currentTarget.value,
			typingTimeout: setTimeout(() => { // Things may be changed in 1.5 seconds
				var selection = this.parseSelected(this.state.selection_text);
				this.updateSelection(selection);
			}, 1500)
		});
	}

	resetPlot()
	{
		if (this.props.sapoResults !== undefined) {
			let selection = this.parseSelected("");

			let dist = hasManyPSets(this.props.sapoResults);
			this.setState({
				axes: this.getAxisNames(this.state.dataType),
				pset_distinction: dist,
				colors: this.createColors(dist),
				selection_text: "",
				pset_selection: selection,
				current_frame: 0,
				changed: true,
			}, () => {
				this.updatePlot();
			});
		}
	}

	setUnplottable()
	{
		this.setState({
			plottable: [],
			selected: [],
			current_frame: 0,
			dataType: "flowpipe",
			animFrames: [],
			slider_steps: [],
			animate: true,
			axes: { 
				x: undefined, 
				y: undefined, 
				z: undefined
			},
			plot_bbox: { 
				x: undefined, 
				y: undefined, 
				z: undefined
			},
			plot_frame: { 
				x: undefined, 
				y: undefined, 
				z: undefined
			},
			changed: false
		});
	}

	plotData()
	{
		if (!this.state.changed) {
			if (this.props.sapoResults !== undefined && this.state.plottable.length===0) {
				this.resetPlot();
			}
		}

		if (this.props.updateChart) {
			this.props.setUpdated();
			this.resetPlot();
		}

		if (this.state.animFrames.length !== 0 || this.state.invariant === undefined) {
			return this.state.selected;
		}
		
		return [...this.state.invariant, ...this.state.selected];
	}

	getProjSubspace(variables)
	{
		var subspace;
		if (this.state.chartType === "2D")
			subspace = [0,1];
		else
			subspace = [0,1,2];
		
		variables.forEach((v, i) => {
			if (v === this.state.axes.x)
				subspace[0] = i;
			if (v === this.state.axes.y)
				subspace[1] = i;
			if (subspace.length === 3 && v === this.state.axes.z)
				subspace[2] = i;
		});

		if (this.state.axes.x === TimeAxisValue) {
			subspace.splice(0,1);
		}

		return subspace;
	}

	setReachPlot(polytopes)
	{
		let plot_bbox = getFlowpipesBoundingBox(polytopes);

		this.setState({ 
			selected: getSelectedFlowpipesPolytopes(polytopes, this.state.pset_selection),
			plottable: polytopes,
			animFrames: [],
			plot_bbox: plot_bbox,
			plot_frame: JSON.parse(JSON.stringify(plot_bbox)),
			slider_steps: [],
			changed: false
		});
	}

	updateInvariantInAnimation(invariant)
	{
		let reached = undefined
		if (this.plottingProof()) {
			reached = []
			this.state.plottable.forEach((polytope,i) => {
				reached.push(polytope[0][0])
			})
		}

		var frames = getFramesForSelectedFlowpipes(this.state.plottable, 
												   this.state.pset_selection,
												   invariant, reached);

		if (frames.length > 0) {
			/* the following line bypasses a reactjs-plotly bug.
			   See https://github.com/plotly/plotly.js/issues/1839 */
			var selectedFrame = deepCopy(frames[this.state.current_frame].data);
			this.setState({ 
				selected: selectedFrame,
				animFrames: frames,
				changed: false
			});
		}
	}

	setAnimPlot(polytopes)
	{
		let reached = undefined
		if (this.plottingProof()) {
			reached = []
			polytopes.forEach((polytope,i) => {
				reached.push(polytope[0][0])
			})
		}
		var frames = getFramesForSelectedFlowpipes(polytopes, this.state.pset_selection,
												   this.state.invariant, reached);

		if (frames.length > 0) {
			let plot_bbox = getFlowpipesBoundingBox(polytopes);

			/* the following line bypasses a reactjs-plotly bug.
			   See https://github.com/plotly/plotly.js/issues/1839 */
			var selectedFrame = deepCopy(frames[this.state.current_frame].data);
			this.setState({ 
				selected: selectedFrame,
				plottable: polytopes,
				animFrames: frames,
				plot_bbox: plot_bbox,
				plot_frame: JSON.parse(JSON.stringify(plot_bbox)),
				slider_steps: build_slider_steps(frames.length),
				changed: false
			});
		}
	}

	setParamPlot(polytopes) 
	{
		let selectedData = [];
		for (let i=0; i<polytopes.length; i++) {
			if (this.state.pset_selection[i]) {
				selectedData.push(polytopes[i]);
			}
		}

		let plot_bbox = getFlowpipesBoundingBox(polytopes);

		this.setState({
			selected: selectedData,
			plottable: polytopes,
			animFrames: [],
			plot_bbox: plot_bbox,
			plot_frame: JSON.parse(JSON.stringify(plot_bbox)),
			slider_steps: [],
			changed: false
		});
	}

	getParameterSet(data_vertices)
	{
		let polytope_gen = [];
		if (this.state.chartType === "2D") {
			polytope_gen = get2DPolygon;
		} else {
			polytope_gen = get3DPolytope;
		}
	
		var polytopes = [];
		for (let i=0; i<data_vertices.length; i++) {
			let polys = this.getPolytopes(polytope_gen, data_vertices[i],
					(this.state.pset_distinction ? i : undefined));
			
			polys.forEach(polytope => polytopes.push(polytope));
		}
	
		return polytopes;
	}

	getFlowpipe2DTimePolygons(flowpipe_vertices, param_set_idx = undefined, 
							  default_color = undefined)
	{
		var polygons = [];
		for (let time=0; time<flowpipe_vertices.length; time++) {
			let intervals = compute1DProjIntervals(flowpipe_vertices[time])
	
			polygons[time] = [];
			// join overlapping intervals
			intervals.forEach((itvl) => {
				// create the two vertices
				var itvl_vertices = [[time, itvl.min], [time, itvl.max]];
	
				let color = (default_color === undefined? this.state.colors[0]: default_color);
				let name = undefined;
				// add the polytope to the dataset
				if (param_set_idx !== undefined) {
					color = this.state.colors[param_set_idx];
					name = 'pSet #'+param_set_idx;
				}
				polygons[time].push(get2DTimePolygon(itvl_vertices, time, color, name));
			});
		}
	
		return polygons;
	}

	getPolytopes(polytope_gen, polyunion_vertices, param_set_idx=undefined, 
				 default_color = undefined, labelling_function = () => {return undefined})
	{
		var polytopes = [];
	
		let label = labelling_function();
		if (param_set_idx !== undefined) {
			if (label !== undefined) {
				label += ' pSet #'+param_set_idx
			} else {
				label = 'pSet #'+param_set_idx
			}
		}

		for (let i=0; i<polyunion_vertices.length; i++) {
			let vertices = polyunion_vertices[i];
	
			let new_poly;
			if (param_set_idx !== undefined) {
				new_poly = polytope_gen(vertices, this.state.colors[param_set_idx], label);
			} else {
				let color = (default_color === undefined ? this.state.colors[0] : default_color);

				new_poly = polytope_gen(vertices, color, label);
			}
			if (new_poly !== null) {
				polytopes.push(new_poly);
			}
		}
	
		return polytopes;
	}

	getFlowpipePolytopes(flowpipe_vertices, param_set_idx=undefined, default_color = undefined, 
						 labelling_function = (time) => {return undefined})
	{
		let timeplot;
		let poly_gen;
		if (this.state.axes.x === TimeAxisValue) {
			if (this.state.chartType === "2D") {
				timeplot = get2DTimePolygon;
			} else {
				timeplot = get3DTimePolylitope;
			}
		} else {
			if (this.state.chartType === "2D") {
				poly_gen = get2DPolygon;
			} else {
				poly_gen = get3DPolytope;
			}
		}

		var f_polytopes = [];
		for (let time=0; time<flowpipe_vertices.length; time++) {
			if (this.state.axes.x === TimeAxisValue) {
				poly_gen = (vertices, color, name) => {
					return timeplot(vertices, time, color, name);
				};
			}
			let polytopes = this.getPolytopes(poly_gen, flowpipe_vertices[time],
												param_set_idx, default_color, 
											    () => { return labelling_function(time)});
			f_polytopes.push(polytopes);
		}

		return f_polytopes;		
	}

	getReachSet(data_vertices, default_color = undefined, 
				labelling_function = (time) => {return undefined})
	{
		var polytopes = [];

		var poly_gen;

		if (this.state.axes.x === TimeAxisValue && this.state.chartType === "2D") {

			// this is just to exploit 2D time series properties and speed-up 
			// their plotting with respect to getPolytopes-based plotting
			poly_gen = (flowpipe_vertices, param_set_idx) => {
				return this.getFlowpipe2DTimePolygons(flowpipe_vertices, param_set_idx, default_color);
			};
		} else {
			poly_gen = (flowpipe_vertices, param_set_idx) => {
				return this.getFlowpipePolytopes(flowpipe_vertices, param_set_idx, default_color, 
												 labelling_function);
			};
		}

		for (let i=0; i<data_vertices.length; i++) {
			polytopes.push(poly_gen(data_vertices[i], (this.state.pset_distinction ? i : undefined)));
		}

		return polytopes;
	}
}	// end Chart

function build_slider_steps(num_of_frames, time_step = 1)
{
	var slider_steps = [];

	for (let i=0; i<num_of_frames; i++) {
		slider_steps.push ({
			label: (time_step*i).toString(),
			method: "animate",
			args: [[i], {
				mode: "immediate",
				transition: {duration: 50},
				frame: {duration: 50}
			}]
		});
	}

	return slider_steps;
}

function getSelectedFlowpipesPolytopes(flowpipes, selection)
{
	var result = [];
	flowpipes.forEach((flowpipe, i) => {
		if (selection[i]) {
			flowpipe.forEach((polytopes) => {
				polytopes.forEach((polytope) => {
					result.push(polytope);
				})
			});
		}
	});

	return result;
}

function build_a_fake_polytope(polytope)
{
	var vertex = [polytope.x[0], polytope.y[0]];
	if ("z" in polytope) {
		vertex.push(polytope.z[0]);
	}
	return getSinglePoint([vertex], polytope.color, polytope.text, 1);
}

function getFramesForSelectedFlowpipes(flowpipes, selection, invariant = undefined, extra = undefined)
{
	var frames = [];
	flowpipes.forEach((flowpipe, i) => {
		if (selection[i]) {
			while (frames.length < flowpipe.length) {
				frames.push({
					name: frames.length.toString(), 
					data: (invariant !== undefined ? [...invariant] : [])
				});

				if (extra !== undefined) {
					extra.forEach((polytope, i) => {
						frames[frames.length-1].data.push(polytope)
					})
				}
			}

			var max_polytopes = flowpipe[flowpipe.length-1].length;
			flowpipe.forEach((polytopes, timestamp) => {
				// Add missing polytopes when a bundle split occurred
				if (polytopes.length > 0 && polytopes[0].hasOwnProperty('x')) {
					var empty_polytope = build_a_fake_polytope(polytopes[0]);
					while (polytopes.length < max_polytopes) {
						polytopes.push(empty_polytope);
					}

					// push the polytopes in the frame
					polytopes.forEach((polytope) => {
						frames[timestamp].data.push(polytope);
						//frames[timestamp].traces.push(frames[timestamp].traces.length);
					});
				}
			});
		}
	});

	return frames;
}

function findMinMaxItvl(vertices, dim=0)
{
	if (vertices.length === 0) {
		return { min: undefined, max: undefined };
	}

	var itvl = { min: vertices[0][dim], max: vertices[0][dim] };
	vertices.forEach((vertex) => {
		if (vertex[dim]>itvl.max) {
			itvl.max = vertex[dim];
		} else {
			if (vertex[dim]<itvl.min) {
				itvl.min = vertex[dim];
			}
		}
	});

	return itvl;
}

function joinOverlappingItvls(itvls)
{
	var joint = [];
	if (itvls.length === 0) {
		return joint;
	}

	itvls.sort(compareItvls);
	var newItvl = Object.assign({}, itvls[0]);
	itvls.forEach((itvl) => {
		if (newItvl.max < itvl.min) {
			joint.push(newItvl);
			newItvl = Object.assign({}, itvl);
		} else {
			newItvl.max = itvl.max;
		}
	});

	joint.push(newItvl);

	return joint;
}

function compareItvls(a, b)
{
	if (a.min<b.min) {
		return -1
	}

	if (a.min>b.min) {
		return 1;
	}

	if (a.max<b.max) {
		return -1
	}

	if (a.max>b.max) {
		return 1;
	}
	return 0;
}

// given a 2D point and an origin, retunrs the quadrant in which the point lies
function findQuadrant(p, c)
{
	if (p[0] > c[0])
		if (p[1] > c[1]) return 1;
		else return 4;
	else
		if (p[1] > c[1]) return 2;
		else return 3;
}

// compares two 2D points according to their angle with respect to the origin c
function compare(p1, p2, c)
{
	if (p1[0] === p2[0] && p1[1] === p2[1]) return 0;
	
	var q1 = findQuadrant(p1, c), q2 = findQuadrant(p2, c);
	
	if (q1 < q2)
		return -1;
	else if (q1 > q2)
		return 1;
	else
	{
		var deltaX1 = 1.0 * p1[0] - c[0], deltaX2 = 1.0 * p2[0] - c[0];
		var deltaY1 = 1.0 * p1[1] - c[1], deltaY2 = 1.0 * p2[1] - c[1];
		
		// p1.x === c.x -> q1 === 2 || q1 === 3
		if (deltaX1 === 0)
		{
			if (q1 === 2) return -1;
			else return 1;
		}
		
		// p2.x === c.x -> q2 === 2 || q2 === 3
		if (deltaX2 === 0)
		{
			if (q2 === 2) return 1;
			else return -1;
		}
		
		if (deltaY1 / deltaX1 < deltaY2 / deltaX2) return -1;
		else return 1;
	}
}

// vertices are sorted counterclockwise
function removeInnerVertices(vertices)
{
	var i = 0;
	var a = vertices[vertices.length - 1];
	var b = vertices[0];
	var c = vertices[1];
	
	while (i < vertices.length)
	{
		if (vertices.length <= 3)
			return vertices;
		// vector ab
		var deltaX = b[0] - a[0], deltaY = b[1] - a[1];
		
		// vector bc
		var x = c[0] - b[0], y = c[1] - b[1];
		
		/* rotation matrix A = [[deltaX, -deltaY], [deltaY, deltaX]]
		 * ab * A = [deltaX^2+deltaY^2, 0]
		 * bc * A = [x*deltaX+y*deltaY, -x*deltaY+y*deltaX]
		 * if y*deltax - x*deltaY > 0, keep b
		 * otherwise, remove it
		 */
		if (y*deltaX - x*deltaY <= 0)
		{
			vertices.splice(i,1);
			b = c;
			c = vertices[(i+1) % vertices.length];
		}
		else
		{
			i++;
			a = b;
			b = c;
			c = vertices[(i+1) % vertices.length];
		}
	}
	
	return vertices;
}

function getSinglePoint(vertices, color = '#ff8f00', name = undefined, marker_size = 7)
{
	var plot_param =  {
			x: [vertices[0][0]],
			y: [vertices[0][1]],
			mode: 'markers',
			type: 'scatter',
			text: name,
			marker: {
				color: color,
				size: marker_size
			},
			hoverinfo: (name !== undefined ? 'text+x+y' : 'x+y')
		};
	
	if (vertices[0].length > 2) {
		plot_param.z = [vertices[0][2]];
	}

	return plot_param;
}

// https://stackoverflow.com/a/470747 must be acknowledged for inspiring the following function
function getDistinctColors(num_colors)
{ 
	// TODO: implements a more efficient algorithm (see https://stackoverflow.com/a/4382138)

	var colors = []
	for(let i = 0; i < num_colors; i++) {
		var frag = 10*i/num_colors;
		colors.push(`hsl(${ 36*frag }, ${ 90+frag }, ${ 50+frag })`);
	}

	return colors;
}		

function compute1DProjIntervals(polyunion_vertices)
{
	let intervals = [];
	for (let j=0; j<polyunion_vertices.length; j++) {
		let vertices = polyunion_vertices[j];
		if (vertices.length !== 0)  // some valid vertices found in
		{
			intervals.push(findMinMaxItvl(vertices));
		}
	}

	return joinOverlappingItvls(intervals);
}


function get2DConvexHullVertices(vertices)
{  // TODO: implement a real 2D convex hull
	// compute the centroid of the set 
	// (is the average the centroid even if 
	// the set is not a bundle?)
	var center = [0.0, 0.0];
	vertices.forEach(v => {center[0]+= v[0]; center[1] += v[1]; });
	center[0] /= vertices.length;
	center[1] /= vertices.length;
	
	vertices.sort((p1, p2) => compare(p1, p2, center));
	// some vertices could be projected inside resulting polygon, remove them
	return removeInnerVertices(vertices);
}

function get2DPolygon(vertices, color = '#ff8f00', name = undefined)
{
	if (vertices.length === 1) {
		return getSinglePoint(vertices, color, name);
	}

	var chull = get2DConvexHullVertices(vertices)
	let xs = [];
	let ys = [];
	if (chull.length > 0) {
		xs = chull.map(e => e[0]).concat([chull[0][0]]);
		ys = chull.map(e => e[1]).concat([chull[0][1]]);
	}
	
	return {
		x: xs,
		y: ys,
		mode: 'lines+markers',
		type: 'scatter',
		fill: 'toself',
		color: color,
		text: name,
		hoverinfo: (name !== undefined ? 'text+x+y' : 'x+y'),
		line: {
			color: color,
			width: 1
		},
		marker: {
			size: 1
		}
	};
}

function get2DTimePolygon(vertices, time, color = '#ff8f00', name = undefined, thickness = 0.4)
{
	var chull = get2DConvexHullVertices(vertices);

	var times = []
	var y = chull.map(e => e[1]);

	for (var j = 0; j < y.length; j++)
		times.push(time-thickness/2);
	for (j = 0; j < y.length; j++)
		times.push(time+thickness/2);
	var l = y.length;
	for (j = 0; j < l; j++) {
		y.push(y[l-j-1]);
	}
	if (y.length > 0) {
		times.push(time-thickness/2);
		y.push(y[0]);
	}

	return {
		x: times,
		y: y,
		mode: 'lines+markers',
		type: 'scatter',
		fill: 'toself',
		color: color,
		text: name,
		hoverinfo: (name !== undefined ? 'text+x+y' : 'x+y'),
		line: {
			color: color,
			width: 1
		},
		marker: {
			size: 1
		}
	};
}

function get3DTimePolylitope(vertices, time, color = '#ff8f00', name = undefined, thickness = 0.4)
{
	var times = []
	var y = vertices.map(e => e[1]);
	var z = vertices.map(e => e[2]);

	for (var j = 0; j < y.length; j++)
		times.push(time-thickness/2);
	for (j = 0; j < y.length; j++)
		times.push(time+thickness/2);
	var l = y.length;
	for (j = 0; j < l; j++) {
		y.push(y[l-j-1]);
		z.push(z[l-j-1]);
	}

	return {
		x: times,
		y: y,
		z: z,
		alphahull: 0,
		type: 'mesh3d',
		color: color,
		text: name,
		hoverinfo: (name !== undefined ? 'text+x+y+z' : 'x+y+z')
	};
}

function getPlanePassingThrough(vertex_a, vertex_b, vertex_c)
{
	var delta1 = math.subtract(vertex_b, vertex_a);
	var delta2 = math.subtract(vertex_c, vertex_a);

	var normal_vect = math.cross(delta1, delta2);
	// normalize normal vector
	var base_idx = 0;
	while (base_idx < normal_vect.length && 
			normal_vect[base_idx] === 0) {
		base_idx++;
	}

	if (normal_vect[base_idx] !== 0) {
		var base = normal_vect[base_idx];
		normal_vect.forEach((value, idx) => {
			normal_vect[idx] = value/base;
		});
	}

	var offset =  math.dot(normal_vect, vertex_a);

	return { normal_vect: normal_vect, offset: offset };
}

function areAllLayingOn(vertices, plane)
{
	for (let vertex of vertices) {
		if (math.dot(plane.normal_vect, vertex) !== plane.offset) {
			return false;
		}
	}

	return true;
}

function getVerticesBoundingBox(vertices)
{
	var max_values = vertices[0].map(v => 0),
		min_values = vertices[0].map(v => 0);

	vertices.forEach((v) => {
		v.forEach((value, index) => {
			if (value > max_values[index]) {
				max_values[index] = value;
			} else {
				if (value < min_values[index]) {
					min_values[index] = value;
				}
			}
		});
	});

	return min_values.map((value, index) => [value, max_values[index]]);
}

function areColinear(vertex_a, vertex_b, vertex_c)
{
	var delta1 = math.subtract(vertex_b, vertex_a);
	if (math.norm(delta1, Infinity) === 0) {
		return true;
	}

	var delta2 = math.subtract(vertex_c, vertex_a);
	if (math.norm(delta2, Infinity) === 0) {
		return true;
	}

	var idx = 0;
	while (idx<delta1.length && delta1[idx] === 0) {
		idx++;
	}

	var base1 = delta1[idx], base2 = delta2;
	for (idx=0; idx<delta1.length; idx++) {
		if (delta1[idx]*base2 !== delta2[idx]*base1) {
			return false;
		}
	}

	return true;
}

function doubleOnDirection(vertices, direction)
{
	// Compute what is meant to be a small number w.r.t. the plot values
	var bbox = getVerticesBoundingBox(vertices);

	var delta_bbox = bbox.map(value => {
		return value[1]-value[0];
	});
	var delta = Math.max(...delta_bbox)/1000;

	// double the vertices using the plane normal vector
	var new_vertices = vertices.map((v) => {
		return v.map((value, index) => {
			return value + delta*direction[index];
		});
	});

	new_vertices.push(...vertices);

	return new_vertices;
}

function getColinearVerticesBBoxBoundaries(vertices)
{
	var idx_dim = -1;
	var min_vert=vertices[0], max_vert=vertices[0];
	while (idx_dim+1 < vertices[0].length && min_vert[idx_dim+1] === max_vert[idx_dim+1]) {
		idx_dim++;
		for (let v of vertices) {
			if (v[idx_dim] > max_vert[idx_dim]) {
				max_vert = v;
			}
			if (v[idx_dim] < min_vert[idx_dim]) {
				min_vert = v;
			}
		};
	}

	return [min_vert, max_vert];
}

function get3DPolytope(vertices, color = '#ff8f00', name = undefined)
{
	if (vertices.length === 1) {
		return getSinglePoint(vertices);
	}

	// Get 3 vertices that do not belong to the same line (we are assuming no repetitions)
	var idx=2;
	while (idx < vertices.length && areColinear(vertices[0], vertices[1], vertices[idx])) {
		idx++;
	}

	// If they exist
	if (idx < vertices.length) {

		// Compute the plane that contains them
		var plane = getPlanePassingThrough(vertices[0], vertices[1], vertices[idx]);

		// If all the vertices belong to the same plane
		if (areAllLayingOn(vertices, plane)) {
			vertices = doubleOnDirection(vertices, plane.normal_vect);
		}

		return {
			x: vertices.map(e => e[0]),
			y: vertices.map(e => e[1]),
			z: vertices.map(e => e[2]),
			type: 'mesh3d',
			alphahull: 0,
			color: color,
			text: name,
			hoverinfo: (name !== undefined ? 'text+x+y+z' : 'x+y+z')
		};
	} 
	
	// all the vertices are colinear and
	// their bounding box is a segment

	// get the segment boundaries
	var boundaries = getColinearVerticesBBoxBoundaries(vertices)

	let xs = [];
	let ys = [];
	let zs = [];

	if (boundaries.length >= 2) {
		xs = [boundaries[0][0], boundaries[1][0]];
		ys = [boundaries[0][1], boundaries[1][1]];
		zs = [boundaries[0][2], boundaries[1][2]];
	}

	return {
		x: xs,
		y: ys,
		z: zs,
		type: 'scatter3d',
		mode: 'lines',
		color: color,
		text: name,
		hoverinfo: (name !== undefined ? 'text+x+y+z' : 'x+y+z'),
		line: {
			width: 6,
			color: color
		}
	};
}
