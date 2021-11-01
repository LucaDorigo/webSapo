import React, { Component } from "react";
import * as math from "mathjs";
import styles from "./style.module.css";

import Plotly from 'plotly.js-gl3d-dist-min'
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

type Props = {};

function getOption(item, selected_cond)
{
	if (selected_cond) {
		return (
			<>
				<option key={"yoption" + item} value={item.name}  selected="selected">{item.name}</option>
			</>
		);
	}

	return (
		<>
			<option key={"yoption" + item} value={item.name}>{item.name}</option>
		</>
	);
}

export default class Chart extends Component<Props> {

	constructor(props) {
		super(props);
		this.state = {
			varData: [],
			paramData: [],
			changed: false,
			chartType: "2D",
			dataType: "vars",
			xAxis: undefined,
			yAxis: undefined,
			zAxis: undefined
		};
	}
	
	render()
	{
		return (
			<>
				<div className={styles.left_chart}>
					<Plot
						data = {this.calcData()}
						layout={{
							autosize: true,
							showlegend: false,
							xaxis: { title: { text: this.state.xAxis } },
							yaxis: { title: { text: this.state.yAxis } },
							scene: {
								xaxis: { title: {
									text: this.state.xAxis,
									font: {
										family: 'Courier New, monospace',
										size: 30,
										color: '#ff8f00'
									}
								}},
								yaxis: { title: {
									text: this.state.yAxis,
									font: {
										family: 'Courier New, monospace',
										size: 30,
										color: '#ff8f00'
									}
								}},
								zaxis: { title: {
									text: this.state.zAxis,
									font: {
										family: 'Courier New, monospace',
										size: 30,
										color: '#ff8f00'
									}
								}}
							}
						}}
						
						useResizeHandler={true}
						style={{width: '100%', height: '80vh'}}
						config={{responsive: true}}
					/>
				</div>
				<div className={styles.right_controls}>
					{this.props.sapoParams !== undefined && <div className={styles.radio_group} onChange={e => this.changeDataType(e, this)}>
						<div className={styles.radio_element}>
							<input className={styles.radio_input} type="radio" defaultChecked value="vars" label="variables" name="dataType"/> Variables
						</div>
						<div className={styles.radio_element}>
							<input className={styles.radio_input} type="radio" value="params" label="parameters" name="dataType"/> Parameters
						</div>
					</div>} {/*closing radio group*/}
					<div className={styles.radio_group} onChange={e => this.setState({ chartType: e.target.value, changed: true })}>
						<div className={styles.radio_element}>
							<input className={styles.radio_input} type="radio" defaultChecked value="2D" label="2D" name="dimensions"/> 2D
						</div>
						<div className={styles.radio_element}>
							<input className={styles.radio_input} type="radio" value="3D" label="3D" name="dimensions"/> 3D
						</div>
					</div> {/*closing radio group*/}
					<div className={styles.selects}>
						<div className={styles.selectRow}>
							<p className={styles.selectLabel}>X axis:</p>
							<select name="xAxis" onChange={e => {this.setState({ xAxis: e.target.value, changed: true}); }} className={styles.select}>
								{this.state.dataType === "vars" && <option value="Time" selected="selected">Time</option> }
								{this.state.dataType === "vars" && this.props.variables.map((item, index) => {
									return getOption(item, false);
								})}
								{this.state.dataType === "params" && this.props.parameters.map((item, index) => {
									return getOption(item, index===0);
								})}
							</select>
						</div>
						<div className={styles.selectRow}>
							<p className={styles.selectLabel}>Y axis:</p>
							<select name="yAxis" onChange={e => {this.setState({ yAxis: e.target.value, changed: true}); }} className={styles.select}>
								{this.state.dataType === "vars" && this.props.variables.map((item, index) => {
									return getOption(item, index===0);
								})}
								{this.state.dataType === "params" && this.props.parameters.map((item, index) => {
									return getOption(item, index===1);
								})}
							</select>
						</div>
						{this.state.chartType === "3D" && 
						<div className={styles.selectRow}>
							<p className={styles.selectLabel}>Z axis:</p>
							<select name="zAxis" onChange={e => {this.setState({ zAxis: e.target.value, changed: true}); }} className={styles.select}>
								{this.state.dataType === "vars" && this.props.variables.map((item, index) => {
									return getOption(item, index===1);
								})}
								{this.state.dataType === "params" && this.props.parameters.map((item, index) => {
									return getOption(item, index===2);
								})}
							</select>
						</div>}
					</div>
				</div> {/*closing right controls*/}
			</>
		);
	}
	
	changeDataType(e, obj)
	{
		var newProps = { dataType: e.target.value,
						 changed: true };

		if (e.target.value === "vars") {
			newProps = Object.assign(newProps, { xAxis: "Time",
									yAxis: this.props.variables[0].name,
									zAxis: this.props.variables[1].name, changed: true});
		} else {
			newProps = Object.assign(newProps, { xAxis: this.props.parameters[0].name,
									yAxis: this.props.parameters[1].name,
									zAxis: this.props.parameters[2].name, changed: true});
		}

		obj.setState(newProps);
	}

	componentDidUpdate(prevProps) {
		var name_if_valid = (property, pos) => (property.length>pos)
		                                        ? property[pos].name 
												: undefined;
		var domain_size;

		if (prevProps.sapoResults !== this.props.sapoResults) {
				
			if (this.state.dataType === "vars") {
				domain_size = this.props.variables.length;
				if (this.state.xAxis === undefined ||
						(this.state.yAxis === undefined && domain_size > 0) ||
						(this.state.zAxis === undefined && domain_size > 1)) {
					this.setState({ xAxis: "Time",
							yAxis: name_if_valid(this.props.variables, 0),
							zAxis: name_if_valid(this.props.variables, 1),
							changed: true});
				}
			} else {
				domain_size = this.props.parameters.length;
				if ((this.state.xAxis === undefined && domain_size > 0) ||
						(this.state.yAxis === undefined && domain_size > 1) || 
						(this.state.zAxis === undefined && domain_size > 2)) {
					this.setState({ xAxis: name_if_valid(this.props.parameters, 0),
							yAxis: name_if_valid(this.props.parameters, 1),
							zAxis: name_if_valid(this.props.parameters, 2),
							changed: true});
				}
			}
		}
	}

	calcData()
	{
		if (this.props.updateChart)
		{
			this.setState({changed: true})
			this.props.setUpdated()
		}
		
		if (!this.state.changed)
			if (this.state.dataType === "vars")
				return this.state.varData;
			else
				return this.state.paramData;
				
		if ((this.state.dataType === "vars" && this.props.sapoResults === undefined) ||
				(this.state.dataType === "params" && this.props.sapoParams === undefined))
		{
			var newProps = {xAxis: undefined,
					yAxis: undefined,
					zAxis: undefined};
			if (this.state.dataType === "vars")
				newProps=Object.assign(newProps, { varData: [], changed: false });
			else
				newProps=Object.assign(newProps, { paramData: [], changed: false });
			
			this.setState(newProps);
			
			return [];
		}

		if (this.state.dataType === "vars")
			return this.calcVarData();
		
		return this.calcParamData();
	}	// end calcData

	getProjSubspace(variables)
	{
		var subspace;
		if (this.state.chartType === "2D")
			subspace = [-1,-1];
		else
			subspace = [-1,-1,-1];
		
		variables.forEach((v, i) => {
			if (v.name === this.state.xAxis)
				subspace[0] = i;
			if (v.name === this.state.yAxis)
				subspace[1] = i;
			if (v.name === this.state.zAxis)
				subspace[2] = i;
		});

		return subspace;
	}

	get2DTimePolygons(linear_system_sets, variables)
	{
		var polygons = [];
		var subspace = this.getProjSubspace(variables);

		var time = 0;
		linear_system_sets.forEach((linear_system_set) => {
			var intervals = [];
			linear_system_set.linear_systems.forEach((linear_system) => {
				var vertices = computeLinearSystemVertices(linear_system);
				if (vertices.length !== 0)  // some valid vertices found in
				{
					intervals.push(findMinMaxItvl(vertices, subspace[1]));
				}
			});

			// join overlapping intervals
			joinOverlappingItvls(intervals).forEach((itvl) => {
				// create the two vertices
				var vertices = [[time, itvl.min], [time, itvl.max]];

				// add the polytope to the dataset
				polygons.push(get2DTimePolygon(vertices, time));
			});
			time = time + 1;
		});

		return polygons;
	}

	getPolytopes(linear_system_sets, variables)
	{
		const polytope_gen = function (vertices, state, time) {
			if (state.xAxis !== "Time") {
				if (state.chartType === "2D") {
					return get2DPolygon(vertices);
				} else {
					return get3DPolylitope(vertices);
				}
			} else {
				if (state.chartType === "2D") {
					return get2DTimePolygon(vertices, time);
				} else {
					return get3DTimePolylitope(vertices, time);
				}
			}
		};
	
		var polytopes = [];
		var subspace = this.getProjSubspace(variables);

		var time = 0;
		linear_system_sets.forEach((linear_system_set) => {
			linear_system_set.linear_systems.forEach((linear_system) => {
				var vertices = computeLinearSystemVertices(linear_system);
				if (vertices.length !== 0)  // some valid vertices found in
				{
					// vertices projected in the subspace
					var proj = getVerticesProjection(vertices, subspace);

					// add the polytope to the dataset
					polytopes.push(polytope_gen(proj, this.state, time));
				}
			});

			time = time + 1;
		});

		return polytopes;
	}

	calcVarData()
	{
		// console.log("Computing polytope vertices")
		// var begin_time = new Date();

		var input = this.props.sapoResults;

		var polytopes = [];
		if (this.state.xAxis === "Time" && this.state.chartType === "2D") {
			// this is just to exploit 2D time series properties and speed-up 
			// their plotting with respect to getPolytopes-based plotting 
			polytopes = this.get2DTimePolygons(input.step_sets, this.props.variables);
		} else {
			polytopes = this.getPolytopes(input.step_sets, this.props.variables);
		}

		if (polytopes.length === 0) {
			alert("There is no data to display");
		}
		this.setState({ varData: polytopes, changed: false });

		// var end_time = new Date();
		// console.log("Vertices has been computed in " + Math.round((end_time.getTime()-begin_time.getTime())/1000) + " seconds.");

		return polytopes;
	} // end calcVarData
	
	
	calcParamData()
	{
		var input = this.props.sapoParams;

		var polytopes = this.getPolytopes([input], this.props.parameters);
		
		if (polytopes.length > 0) {
			this.setState({ paramData: polytopes, changed: false });
			return polytopes;
		} else {
			alert("The set of parameters is empty!");
			this.setState({ paramData: polytopes, changed: false });
			return polytopes;
		}
	}
}	// end Chart

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
	if (v1.lenght > v2.length) return 1;
	
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

function isValidVertex(vertex, linear_system, tol)
{
	for (var i = 0; i < linear_system.directions.length; i++)
	{
		var dir = math.dot(linear_system.directions[i], vertex);
		if (dir > linear_system.offsets[i] + tol) {
			return false;
		}
	}

	return true;
}

function computeLinearSystemVertices(linear_system, tol = 0.01)
{
	var vertices = [];
				
	var directions = linear_system.directions;
	var offsets = linear_system.offsets;

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

			if (isValidVertex(vertex, linear_system, tol)) {
				vertices.push(vertex);
			}
		}
		
		// find next combination
		hasNext = findNextCombination(A_comb);
	}

	return vertices
}

function getVerticesProjection(vertices, subspace)
{
	// vertices projected in the subspace
	var proj = vertices.map(e => subspace.map(i => {
		if (i !== -1) return e[i]; else return -1;
	}));

	// Delete duplicates vertices
	proj.sort();
	var j = 0;
	while (j+1 < proj.length)
	{
		if (compareArray(proj[j], proj[j+1]) === 0)
			proj.splice(j+1, 1);
		else
			j++;
	}

	return proj
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

function get2DSinglePoint(vertices)
{
	return {
		x: [vertices[0][0]],
		y: [vertices[0][1]],
		mode: 'markers',
		type: 'scatter',
		marker: {
			color: '#ff8f00',
			size: 7
		}
	};	
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

function get2DPolygon(vertices)
{
	if (vertices.length === 1) {
		return get2DSinglePoint(vertices);
	}

	var chull = get2DConvexHullVertices(vertices)

	return {
		x: chull.map(e => e[0]).concat([chull[0][0]]),
		y: chull.map(e => e[1]).concat([chull[0][1]]),
		mode: 'lines',
		type: 'scatter',
		fill: 'toself',
		line: {
			color: '#ff8f00',
			width: 0
		}
	};
}

function get2DTimePolygon(vertices, time, thickness = 0.4)
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
		mode: 'lines',
		type: 'scatter',
		fill: 'toself',
		line: {
			color: '#ff8f00',
			width: 2
		}
	};
}

function get3DTimePolylitope(vertices, time, thickness = 0.4)
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
		color: '#ff8f00',
		hoverinfo: 'none'
	};
}

function get3DPolylitope(vertices)
{
	return {
		x: vertices.map(e => e[0]),
		y: vertices.map(e => e[1]),
		z: vertices.map(e => e[2]),
		type: 'mesh3d',
		alphahull: 0,
		color: '#ff8f00',
		hoverinfo: 'none'
	};
}
