import React, { Component } from "react";
import * as math from "mathjs";
import styles from "./style.module.css";
import { deepCopy } from "../../constants/global";

import Plotly from 'plotly.js-gl3d-dist-min'
import createPlotlyComponent from 'react-plotly.js/factory';
import { toast } from 'react-toastify';

const Plot = createPlotlyComponent(Plotly);

type Props = {};

function getOption(item, selected_cond)
{
	if (selected_cond) {
		return (
			<>
				<option key={"yoption" + item} value={item}  selected="selected">{item}</option>
			</>
		);
	}

	return (
		<>
			<option key={"yoption" + item} value={item}>{item}</option>
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

function hasManyPSets(sapoResults)
{
	return sapoResults !== undefined && sapoResults.data.length > 1;
}

export default class Chart extends Component<Props> {

	constructor(props) {
		super(props);

		this.state = {
			reachData: [],                // Overall reachability data: one flow pipe per parameter set
			paramData: [],                // Overall parameter set data: a list of parameter set
			reachPlottable: [],           // reachability polygons filtered by pset_selection
			paramPlottable: [],           // parameter polygons filtered by pset_selection
			animFrames: [],               // frames for reachability animation
			current_frame: 0,			  // index of the current frame
			animBBox: [],			      // the bounding box of the reachability procedure
			slider_steps: [],             // the slider steps for reachability animation
			camera:	getInitialCamera(),   // camera object for 3D plots (see Plotly.scene.camera)			   		   
			animate: true,                // a Boolean flag for reachability animation
			selection_text: "",           // the text describing the parameter set selection
			pset_selection: [],           // a Boolean filter for reachData and paramData
			pset_selection_error: false,  // a Boolean flag signaling an error on the last selection
			colors: [],                   // colors for reachData and paramData
			pset_distinction: false,      // a Boolean flag for distinguishing parameter set data
			typingTimeout: 0,             // a timeout for the parameter set selector
			changed: false,               // a Boolean flag for changes
			chartType: "2D",              // chart type, i.e., either "2D" or "3D"
			dataType: "reachability",     // data type, i.e., either "reachability" or "parameters"
			axes: { x: undefined,         // axis names
			        y: undefined, 
					z: undefined }
		};
	}

	render()
	{
		return (
			<>
				<div className={styles.left_chart}>
					<Plot
						data = {this.calcData()}
						frames={this.state.animFrames}
						layout={{
							/* to remove title space */
							margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
							autosize: true,
							showlegend: false,
							xaxis: { 
								title: { text: this.state.axes.x },
								autorange: !this.plottingAnimation(),
								range: this.state.animBBox.x
							 },
							yaxis: { 
								title: { text: this.state.axes.y },
								autorange: !this.plottingAnimation(),
								range: this.state.animBBox.y
							},
							scene: {
								xaxis: { 
									title: {
										text: this.state.axes.x,
										/*font: {
											family: 'Computer Modern Roman',
											size: 20,
											//color: '#ff8f00'
										}*/
									},
									autorange: !this.plottingAnimation(),
									range: this.state.animBBox.x
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
									autorange: !this.plottingAnimation(),
									range: this.state.animBBox.y
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
									autorange: !this.plottingAnimation(),
									range: this.state.animBBox.z
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
						onRelayout={(layout) => { if ('scene.camera' in layout) {
								// here using setState bring me back to frame 0
								this.setState({camera: layout['scene.camera']});
							}
						}}
						onAnimatingFrame={(frame) => {
							//this.setState({current_frame: parseInt(frame.name)});
						}}
					/>
				</div>
				<div className={styles.right_controls}>
					{this.hasParamData() && <div className={styles.radio_group} onChange={e => this.changeDataType(e)}>
						<div className={styles.radio_element}>
							<input type="radio" defaultChecked={this.plottingReachability()} value="reachability" name="dataType"/> Reachability
						</div>
						<div className={styles.radio_element}>
							<input type="radio" defaultChecked={this.plottingParameters()} value="parameters" name="dataType"/> Parameters
						</div>
					</div>} {/*closing radio group*/}
					<div className={styles.radio_group} onChange={e => this.setState({ chartType: e.target.value, changed: true })}>
						<div className={styles.radio_element}>
							<input type="radio" defaultChecked={this.state.chartType === "2D"} value="2D" label="2D" name="dimensions"/> 2D
						</div>
						<div className={styles.radio_element}>
							<input type="radio" defaultChecked={this.state.chartType === "3D"} value="3D" label="3D" name="dimensions"/> 3D
						</div>
					</div> {/*closing radio group*/}
					{ this.plottingReachability() && <div className={styles.radio_group}>
						<div className={styles.radio_element}>
							<input id="animation" type="checkbox" value="animation" defaultChecked={this.plottingAnimation()}  onChange={e => this.changeAnimation(e)}/> Flowpipe animation
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
								<input id="pset-selector" type="text" placeholder="e.g., '2-4, 6'" onChange={e => this.changedPSetSelector(e)}/>
							</div>
						</div>
					</div>} {/*closing text group*/}
					<div className={styles.selects}>
						<div className={styles.selectRow}>
							<p className={styles.selectLabel}>X axis:</p>
							<select name="xAxis" onChange={e => { this.changeAxis('x', e.target.value); }} className={styles.select}>
								{this.plottingReachability() && <option value="Time">Time</option> }
								{this.plottingReachability() && this.props.sapoResults.variables.map((item, index) => {
									return getOption(item, index===0);
								})}
								{this.plottingParameters() && this.props.sapoResults.parameters.map((item, index) => {
									return getOption(item, index===0);
								})}
							</select>
						</div>
						<div className={styles.selectRow}>
							<p className={styles.selectLabel}>Y axis:</p>
							<select name="yAxis" onChange={e => { this.changeAxis('y', e.target.value); }} className={styles.select}>
								{this.plottingReachability() && this.props.sapoResults.variables.map((item, index) => {
									return getOption(item, index===1);
								})}
								{this.plottingParameters() && this.props.sapoResults.parameters.map((item, index) => {
									return getOption(item, index===1);
								})}
							</select>
						</div>
						{this.state.chartType === "3D" && 
						<div className={styles.selectRow}>
							<p className={styles.selectLabel}>Z axis:</p>
							<select name="zAxis" onChange={e => { this.changeAxis('z', e.target.value); }} className={styles.select}>
								{this.plottingReachability() && this.props.sapoResults.variables.map((item, index) => {
									return getOption(item, index===2);
								})}
								{this.plottingParameters() && this.props.sapoResults.parameters.map((item, index) => {
									return getOption(item, index===2);
								})}
							</select>
						</div>}
					</div>
				</div> {/*closing right controls*/}
			</>
		);
	}

	changeAxis(axis_name, value)
	{
		var axes = this.state.axes;
		axes[ axis_name ] = value;
		this.setState({ axes: axes, changed: true }); 
	}

	plottingReachability()
	{
		return this.props.sapoResults !== undefined && this.state.dataType === "reachability";
	}

	plottingParameters()
	{
		return this.props.sapoResults !== undefined && this.state.dataType === "parameters";
	}

	plottingAnimation()
	{
		return this.plottingReachability() && this.state.animate
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

	getAxisNames(dataType)
	{
		var axis_names = {};

		var dims;
		if (dataType === "reachability") {
			dims = this.props.sapoResults.variables;
		} else {
			dims = this.props.sapoResults.parameters;
		}

		axis_names.x = name_if_valid(dims, 0);
		axis_names.y = name_if_valid(dims, 1, axis_names.x);
		axis_names.z = name_if_valid(dims, 2, axis_names.x);

		return {axes: axis_names};
	}

	changeDataType(e)
	{
		this.setState(Object.assign(this.getAxisNames(e.target.value),
								   { dataType: e.target.value, changed: true }));
	}
	
	changeAnimation(e)
	{
		this.setState({ animate: e.currentTarget.checked, changed: true });
	}

	createColors(distinct)
	{
		var colors;
		if (distinct) {
			colors = getDistinctColors(this.props.sapoResults.data.length);
		} else {
			var color = getDistinctColors(1)[0];

			colors = [];
			for (let i=0; i<this.props.sapoResults.data.length; i++) {
				colors.push(color);
			}
		}

		return colors;
	}

	changeDistinguish(e)
	{
		this.setState({ pset_distinction: e.currentTarget.checked, 
						colors: this.createColors(e.currentTarget.checked),
						changed: true });
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

	changedPSetSelector(e)
	{
		const self = this;

		// Changes selection only after 1.5 seconds after the user stops writing
		if (self.state.typingTimeout) {
       		clearTimeout(this.state.typingTimeout);
    	}

		this.setState({
			selection_text: e.currentTarget.value,
			typingTimeout: setTimeout(function () {
				if (self.props.sapoResults !== undefined) { // Things may be changed in 1.5 seconds
					var selection = self.parseSelected(self.state.selection_text);

					if (selection !== undefined) {

						if (self.plottingAnimation()) {
							var frames = getFramesForSelectedFlowpipes(self.state.reachData, selection);

							/* the following line bypasses a reactjs-plotly bug.
							   See https://github.com/plotly/plotly.js/issues/1839 */
							var plottable = deepCopy(frames[0].data);
							self.setState({ reachPlottable: plottable,
											animFrames: frames });
						} else {
							self.setState({ reachPlottable: getSelectedFlowpipesPolytopes(self.state.reachData, selection) });
						}

						self.setState({ pset_selection: selection, 
									    pset_selection_error: false, 
										paramPlottable: self.state.paramData.filter( (e, i) => selection[i]), 
										changed: true });
					} else {
						toast.error("Wrong selection");
						self.setState({ pset_selection_error: true }); 
					}
				}
			}, 1500),
			changed: false
		});
	}

	updatePlotData()
	{
		if (this.props.sapoResults !== undefined) {
			var newProps = this.getAxisNames(this.state.dataType);

			newProps.pset_distinction = hasManyPSets(this.props.sapoResults);
			newProps.colors = this.createColors(newProps.pset_distinction);
			
			newProps.selection_text = "";
			newProps.pset_selection = [];
			for (let i=0; i<this.props.sapoResults.data.length; i++) {
				newProps.pset_selection.push(true);
			}

			newProps.changed = true;

			this.setState(newProps);
		}
	}

	calcData()
	{
		if (this.props.sapoResults === undefined) {
			return [];
		}

		if (this.props.updateChart)
		{
			this.updatePlotData();
			this.props.setUpdated();
		}
		
		if (!this.state.changed) {
			if (this.plottingReachability()) {
				return this.state.reachPlottable;
			}
			
			if (this.plottingParameters()) {
				return this.state.paramPlottable;
			} 

			return [];
		}

		if ((this.plottingReachability() && !this.hasReachData()) ||
				(this.plottingParameters() && !this.hasParamData()))
		{
			var newProps = {axes: { x: undefined, y: undefined, z: undefined} };
			if (this.plottingReachability())
				newProps=Object.assign(newProps, { reachData: [], reachPlottable: [], changed: false });
			else
				newProps=Object.assign(newProps, { paramData: [], paramPlottable: [], changed: false });

			this.setState(newProps);

			this.props.setExecuting(false);

			return [];
		}

		var polytopes;
		if (this.plottingReachability()) {
			polytopes = this.calcReachData();
		} else {
			polytopes = this.calcParamData();
		}

		this.props.setExecuting(false);

		return polytopes;
	}	// end calcData

	getProjSubspace(variables)
	{
		var subspace;
		if (this.state.chartType === "2D")
			subspace = [-1,-1];
		else
			subspace = [-1,-1,-1];
		
		variables.forEach((v, i) => {
			if (v === this.state.axes.x)
				subspace[0] = i;
			if (v === this.state.axes.y)
				subspace[1] = i;
			if (v === this.state.axes.z)
				subspace[2] = i;
		});

		return subspace;
	}

	getFlowpipe2DTimePolygons(flowpipe, variables, param_set_idx = undefined)
	{
		var polygons = [];
		var subspace = this.getProjSubspace(variables);

		var time = 0;
		flowpipe.forEach((convex_polihedra_union) => {
			var intervals = [];
			convex_polihedra_union.forEach((convex_polihedron) => {
				var vertices = computeConvexPolyhedronVertices(convex_polihedron);
				if (vertices.length !== 0)  // some valid vertices found in
				{
					intervals.push(findMinMaxItvl(vertices, subspace[1]));
				}
			});

			polygons[time] = [];
			// join overlapping intervals
			joinOverlappingItvls(intervals).forEach((itvl) => {
				// create the two vertices
				var vertices = [[time, itvl.min], [time, itvl.max]];

				// add the polytope to the dataset
				if (param_set_idx !== undefined) {
					polygons[time].push(get2DTimePolygon(vertices, time, this.state.colors[param_set_idx], 'pSet #'+param_set_idx));
				} else {
					polygons[time].push(get2DTimePolygon(vertices, time, this.state.colors[0], undefined));
				}
			});
			time = time + 1;
		});

		return polygons;
	}

	getPolytopes(convex_polihedra_union, variables, param_set_idx=undefined)
	{
		const polytope_gen = function (vertices, state, color, name) {
			if (state.chartType === "2D") {
				return get2DPolygon(vertices, color, name);
			} else {
				return get3DPolylitope(vertices, color, name);
			}
		};
	
		var polytopes = [];
		var subspace = this.getProjSubspace(variables);

		convex_polihedra_union.forEach((convex_polihedron) => {
			var vertices = computeConvexPolyhedronVertices(convex_polihedron);
			if (vertices.length !== 0)  // some valid vertices found in
			{
				// vertices projected in the subspace
				var proj = getVerticesProjection(vertices, subspace);

				// add the polytope to the dataset
				if (param_set_idx !== undefined) {
					polytopes.push(polytope_gen(proj, this.state, this.state.colors[param_set_idx], 'pSet #'+param_set_idx));
				} else {
					polytopes.push(polytope_gen(proj, this.state, this.state.colors[0], undefined));
				}
			}
		});

		return polytopes;
	}

	getFlowpipePolytopes(flowpipe, variables, param_set_idx=undefined) {
		const polytope_gen = function (vertices, state, time, color, name) {
			if (state.axes.x !== "Time") {
				if (state.chartType === "2D") {
					return get2DPolygon(vertices, color, name);
				} else {
					return get3DPolylitope(vertices, color, name);
				}
			} else {
				if (state.chartType === "2D") {
					return get2DTimePolygon(vertices, time, color, name);
				} else {
					return get3DTimePolylitope(vertices, time, color, name);
				}
			}
		};
	
		var polytopes = [];
		var subspace = this.getProjSubspace(variables);

		var time = 0;
		flowpipe.forEach((convex_polihedra_union) => {
			polytopes[time] = [];
			convex_polihedra_union.forEach((convex_polihedron) => {
				var vertices = computeConvexPolyhedronVertices(convex_polihedron);
				if (vertices.length !== 0)  // some valid vertices found in
				{
					// vertices projected in the subspace
					var proj = getVerticesProjection(vertices, subspace);

					// add the polytope to the dataset
					if (param_set_idx !== undefined) {
						polytopes[time].push(polytope_gen(proj, this.state, time, this.state.colors[param_set_idx], 'pSet #'+param_set_idx));
					} else {
						polytopes[time].push(polytope_gen(proj, this.state, time, this.state.colors[0], undefined));
					}
				}
			});

			time = time + 1;
		});

		return polytopes;		
	}

	calcReachData()
	{
		// console.log("Computing polytope vertices")
		// var begin_time = new Date();

		var polytopes = [];
		if (this.state.axes.x === "Time" && this.state.chartType === "2D") {
			// this is just to exploit 2D time series properties and speed-up 
			// their plotting with respect to getPolytopes-based plotting
			this.props.sapoResults.data.forEach((elem, i) => {
				polytopes.push(this.getFlowpipe2DTimePolygons(elem[ 'flowpipe' ], this.props.sapoResults.variables, 
										  (this.hasParamData() && this.props.sapoResults.data.length > 1 ? i : undefined)));
			});
		} else {
			this.props.sapoResults.data.forEach((elem, i) => {
				polytopes.push(this.getFlowpipePolytopes(elem[ 'flowpipe' ], this.props.sapoResults.variables, 
										  (this.hasParamData() && this.props.sapoResults.data.length > 1 ? i : undefined)));
			});
		}

		if (polytopes.length === 0) {
			toast.info("The reached set is empty.");
		}

		if (this.plottingAnimation()) {
			var frames = getFramesForSelectedFlowpipes(polytopes, this.state.pset_selection);

			if (frames.length > 0) {
				/* the following line bypasses a reactjs-plotly bug.
				   See https://github.com/plotly/plotly.js/issues/1839 */
				var plottable = deepCopy(frames[0].data);
				this.setState({ reachData: polytopes,
								reachPlottable: plottable,
								animFrames: frames,
								animBBox: getFramesBBox(frames),
								slider_steps: build_slider_steps(frames.length),
								changed: false });
			}
		} else {
			var reachPlottable = getSelectedFlowpipesPolytopes(polytopes, this.state.pset_selection);
			this.setState({ reachData: polytopes,
							reachPlottable: reachPlottable,
							animFrames: [],
							animBBox: [],
							slider_steps: [],
							changed: false });
		}

		// var end_time = new Date();
		// console.log("Vertices has been computed in " + Math.round((end_time.getTime()-begin_time.getTime())/1000) + " seconds.");

		return this.state.reachPlottable;
	} // end calcReachData
	
	
	calcParamData()
	{
		var polytopes = [];
		this.props.sapoResults.data.forEach((elem, i) => {
			this.getPolytopes(elem[ 'parameter set' ], this.props.sapoResults.parameters, 
										  (this.hasParamData() && this.props.sapoResults.data.length > 1 ? i : undefined)).forEach((polytope) => {
				polytopes.push(polytope);
			});
		});

		if (polytopes.length === 0) {
			toast.info("The set of parameters is empty");
		}

		var plottable = polytopes.filter((e,i) => this.state.pset_selection[i]);
		this.setState({ paramData: polytopes,
		                paramPlottable: plottable,
						changed: false });

		return this.state.paramPlottable;
	}
}	// end Chart

function getFramesBBox(frames, expand_ratio=0.05)
{
	var dims = ['x', 'y', 'z'];

	var bbox = {};

	frames.forEach((frame) => {
		frame.data.forEach((polytope) => {
			for (let dim of dims) {
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

	for (let dim of dims) {
		if (dim in bbox) {
			var expand_size = (bbox[dim][1]-bbox[dim][0])*expand_ratio/2;
			bbox[dim][0] -= expand_size;
			bbox[dim][1] += expand_size;
		}
	}

	return bbox;
}

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

function getFramesForSelectedFlowpipes(flowpipes, selection)
{
	var frames = [];
	flowpipes.forEach((flowpipe, i) => {
		if (selection[i]) {
			while (frames.length < flowpipe.length) {
				frames.push({name: frames.length.toString(), data: [] /*, traces: []*/ });
			}
			var max_polytopes = flowpipe[flowpipe.length-1].length;
			flowpipe.forEach((polytopes, timestamp) => {
				// Add missing polytopes when a bundle split occurred
				var empty_polytope = build_a_fake_polytope(polytopes[0]);
				while (polytopes.length < max_polytopes) {
					polytopes.push(empty_polytope);
				}

				// push the polytopes in the frame
				polytopes.forEach((polytope) => {
					frames[timestamp].data.push(polytope);
					//frames[timestamp].traces.push(frames[timestamp].traces.length);
				});
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

function compareArray(v1, v2)
{
	if (v1.length < v2.length) return -1;
	if (v1.length > v2.length) return 1;
	
	for (var i = 0; i < v1.length; i++)
	{
		if (v1[i] < v2[i]) return -1;
		if (v1[i] > v2[i]) return 1;
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

function isValidVertex(vertex, convex_polihedron, tol)
{
	for (var i = 0; i < convex_polihedron.A.length; i++)
	{
		var dir = math.dot(convex_polihedron.A[i], vertex);
		if (dir > convex_polihedron.b[i] + tol) {
			return false;
		}
	}

	return true;
}

function computeConvexPolyhedronVertices(convex_polihedron, tol = 0.00000001)
{
	var vertices = [];
				
	let directions = convex_polihedron.A;
	let offsets = convex_polihedron.b;

	if (directions.length === 0) {
		return vertices;
	}

	var A_comb = getFirstCombination(directions[0].length, directions.length);
	var hasNext = true;

	/* find possible vertices */
	while (hasNext)
	{
		var mat = directions.filter((item, pos) => A_comb[pos] === 1);
		if (math.det(mat) !== 0) {
			var v = offsets.filter((item, pos) => A_comb[pos] === 1);
			var vertex = math.lusolve(mat, v).reduce((acc, el) => acc.concat(el), [])

			if (isValidVertex(vertex, convex_polihedron, tol)) {
				vertices.push(vertex);
			}
		}
		
		// find next combination
		hasNext = findNextCombination(A_comb);
	}

	return vertices
}

function filterDuplicateVertices(vertices)
{
	vertices.sort();
	var j = 0;
	while (j+1 < vertices.length)
	{
		if (compareArray(vertices[j], vertices[j+1]) === 0)
			vertices.splice(j+1, 1);
		else
			j++;
	}

	return vertices;
}

function getVerticesProjection(vertices, subspace)
{
	// vertices projected in the subspace
	var proj = vertices.map(e => subspace.map(i => {
		if (i !== -1) return e[i]; else return -1;
	}));

	return filterDuplicateVertices(proj);
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

function getFirstCombination(k, n)
{
	// initial combination
	return Array.from({length: n}, 
						(_, i) => {
							if (i<k) {
								return 1;
							} else {
								return 0;
							}
						});
}

function findNextCombination(combination)
{
	var l = combination.length - 1;
	
	if (combination[l] === 0)
	{
		var i = 1;
		while (combination[l-i] === 0)
			i++;
		
		// combination[l-i]===1 and 
		// combination[l-i+1]===0
		combination[l-i] = 0;
		combination[l-i+1] = 1;
	}
	else
	{
		// search for the last 0 in the combination
		var j = 1;
		while (j <= l && combination[l-j] === 1)
			j++;

		var k = j;

		// search for the successive last 1
		while (j <= l && combination[l-j] === 0)
			j++;
		
		// if there is no successive 1
		if (j > l) {
			// all the 1s are at the end of the 
			// array and there is no successive 
			// combination
			return false;
		}
		
		// otherwise, combination[l-j]===1 and
		// combination[l-j+1]===0
		combination[l-j] = 0;
		var pos = l-j+1;
		while (pos <= l-j+1+k)
		{
			combination[pos] = 1;
			pos++;
		}
		while (pos <= l)
		{
			combination[pos] = 0;
			pos++;
		}
	}
	return true;
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

	return {
		x: chull.map(e => e[0]).concat([chull[0][0]]),
		y: chull.map(e => e[1]).concat([chull[0][1]]),
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
	times.push(time-thickness/2);
	y.push(y[0]);

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

function getBoundingBox(vertices)
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
	var bbox = getBoundingBox(vertices);

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

function get3DPolylitope(vertices, color = '#ff8f00', name = undefined)
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

	return {
		x: [boundaries[0][0], boundaries[1][0]],
		y: [boundaries[0][1], boundaries[1][1]],
		z: [boundaries[0][2], boundaries[1][2]],
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
