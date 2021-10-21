import React, { Component } from "react";
import Plot from "react-plotly.js";
import * as math from "mathjs";
import styles from "./style.module.css";

type Props = {};

export default class Chart extends Component<Props> {

	constructor(props) {
		super(props);
		this.state = {
			varData: [],
			paramData: [],
			changed: false,
			chartType: "2D",
			dataType: "vars",
			xAxis: "undefined",
			yAxis: "undefined",
			zAxis: "undefined"
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
					<div className={styles.radio_group} onChange={e => this.changeChartType(e, this)}>
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
								<option value="undefined">undefined</option>
								{this.state.dataType === "vars" && this.props.variables.map((item, index) => {
									return (
										<>
											<option key={"xoption" + item} value={item.name}>{item.name}</option>
										</>
									);
								})}
								{this.state.dataType === "params" && this.props.parameters.map((item, index) => {
									return (
										<>
											<option key={"xoption" + item} value={item.name}>{item.name}</option>
										</>
									);
								})}
								{this.state.dataType === "vars" && <option value="Time">Time</option> }
							</select>
						</div>
						<div className={styles.selectRow}>
							<p className={styles.selectLabel}>Y axis:</p>
							<select name="yAxis" onChange={e => {this.setState({ yAxis: e.target.value, changed: true}); }} className={styles.select}>
								<option value="undefined">undefined</option>
								{this.state.dataType === "vars" && this.props.variables.map((item, index) => {
									return (
										<>
											<option key={"yoption" + item} value={item.name}>{item.name}</option>
										</>
									);
								})}
								{this.state.dataType === "params" && this.props.parameters.map((item, index) => {
									return (
										<>
											<option key={"yoption" + item} value={item.name}>{item.name}</option>
										</>
									);
								})}
							</select>
						</div>
						{this.state.chartType === "3D" && 
						<div className={styles.selectRow}>
							<p className={styles.selectLabel}>Z axis:</p>
							<select name="zAxis" onChange={e => {this.setState({ zAxis: e.target.value, changed: true}); }} className={styles.select}>
								<option value="undefined">undefined</option>
								{this.state.dataType === "vars" && this.props.variables.map((item, index) => {
									return (
										<>
											<option key={"yoption" + item} value={item.name}>{item.name}</option>
										</>
									);
								})}
								{this.state.dataType === "params" && this.props.parameters.map((item, index) => {
									return (
										<>
											<option key={"yoption" + item} value={item.name}>{item.name}</option>
										</>
									);
								})}
							</select>
						</div>}
					</div>
				</div> {/*closing right controls*/}
			</>
		);
	}
	
	changeChartType(e, obj)
	{
		if (e.target.value === "2D")
			obj.setState({ chartType: e.target.value, changed: true, zAxis: "undefined" });
		else
			obj.setState({ chartType: e.target.value, changed: true });
	}
	
	changeDataType(e, obj)
	{
		obj.setState({
			dataType: e.target.value,
			changed: true,
			xAxis: "undefined",
			yAxis: "undefined",
			zAxis: "undefined"
		});
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
				(this.state.dataType === "params" && this.props.sapoParams === undefined) ||
				this.state.xAxis === "undefined" ||
				this.state.yAxis === "undefined" ||
				(this.state.chartType === "3D" && this.state.zAxis === "undefined"))
		{
			if (this.state.dataType === "vars")
				this.setState({ varData: [], changed: false });
			else
				this.setState({ paramData: [], changed: false });
			
			return [];
		}
		
		var data;
		if (this.state.dataType === "vars")
			data = this.calcVarData()
		else
			data = this.calcParamData()
		
		return data;
	}	// end calcData
	
	calcVarData()
	{
		var time = this.state.xAxis === "Time";
		
		var input = this.props.sapoResults;
		var varNum = this.props.variables.filter(v => v.lMatrixExtra !== true).length
		
		// initialize data var, which holds the results
		var data;
		if (this.state.chartType === "2D" && time)
		{
			data = [{
				x: [],
				y: [],
				mode: 'lines+markers',
				type: 'scatter',
				name: 'max',
				line: {
					color: '#ff8f00',
					width: 2,
					shape: 'spline'
				}
			}, {
				x: [],
				y: [],
				mode: 'lines+markers',
				type: 'scatter',
				name: 'min',
				fill: 'tonexty',
				line: {
					color: '#ff8f00',
					width: 2,
					shape: 'spline'
				}
			}];
			input.regions.forEach((r, i) => {
				data[0].x.push(i);
				data[1].x.push(i);
			});
		}
		else
			data = [];
		
		if (input.regions.length === 0)
		{
			alert("There is no data to display");
			this.setState({ varData: [], changed: false });
			return [];
		}
		
		var directions = input.directions;
		
		// subspace definition, array of positions of corresponding variable
		var subspace;
		if (this.state.chartType === "2D")
			subspace = [-1,-1];
		else
			subspace = [-1,-1,-1];
		
		this.props.variables.forEach((v, i) => {
			if (v.name === this.state.xAxis)
				subspace[0] = i;
			if (v.name === this.state.yAxis)
				subspace[1] = i;
			if (v.name === this.state.zAxis)
				subspace[2] = i;
		});
		
		
		//var As = getCombinations(directions.length, varNum);
		
		input.regions.forEach((r, k) => {
			var LB = r.lb, UB = r.ub;
			var bs = getCouples(LB, UB);
			var vertices = [];
			
			// initial linear system
			var A = [];
			for (var i = 0; i < directions.length; i++)
			{
				if (i < varNum) A.push(1);
				else A.push(0);
			}
			var hasNext = true;
			
			/* find possible vertices */
			while (hasNext)
			{
				var mat = directions.filter((item, pos) => A[pos] === 1);
				bs.forEach(b => {
					var v = b.filter((item, pos) => A[pos] === 1);
					if (math.det(mat) !== 0)
						vertices.push(math.lusolve(mat, v).reduce((acc, el) => acc.concat(el), []));
				});
				
				// find next linear set
				hasNext = findNext(A);
			}
			
			removeWrongVertices(vertices, directions, LB, UB, 0.001);
			
			// vertices projected in the subspace
			var proj = vertices.map(e => subspace.map(i => {
				if (i !== -1) return e[i]; else return -1;
			}));
			
			if (proj.length === 0)
			{
				this.setState({ varData: [], paramData: [] });
				return;
			}
			
			// if 2D, delete duplicates vertices
			if (this.state.chartType === "2D")
			{
				proj.sort();
				var j = 0;
				while (j+1 < proj.length)
				{
					if (compareArray(proj[j], proj[j+1]) === 0)
						proj.splice(j+1, 1);
					else
						j++;
				}
			}
			
			
			if (this.state.chartType === "2D" && time)
			{
				var max = proj[0][1], min = proj[0][1];
				proj.forEach(v => {
					if (v[1] > max) max = v[1];
					else if (v[1] < min) min = v[1];
				});
				data[0].y.push(max)
				data[1].y.push(min)
			}
			else if (this.state.chartType === "2D")
			{
				var center = [0.0, 0.0];
				proj.forEach(v => {center[0]+= v[0]; center[1] += v[1]; });
				center[0] /= proj.length;
				center[1] /= proj.length;
				
				proj.sort((p1, p2) => compare(p1, p2, center));
				// some vertices could be projected inside resulting polygon, remove them
				proj = removeInnerVertices(proj);
				
				if (proj.length === 1)
				{
					data.push({
						x: [proj[0][0]],
						y: [proj[0][1]],
						mode: 'markers',
						type: 'scatter',
						marker: {
							color: '#ff8f00',
							size: 7
						}
					});
				}
				else
				{
					data.push({
							x: proj.map(e => e[0]).concat([proj[0][0]]),
							y: proj.map(e => e[1]).concat([proj[0][1]]),
							mode: 'lines',
							type: 'scatter',
							fill: 'toself',
							line: {
								color: '#ff8f00',
								width: 2
							}
						});
				}
			}
			else if (time)
			{
				data.push({
					x: [],
					y: proj.map(e => e[1]),
					z: proj.map(e => e[2]),
					alphahull: 0,
					type: 'mesh3d',
					color: '#ff8f00',
					hoverinfo: 'none'
				});
				for (j = 0; j < data[data.length - 1].y.length; j++)
					data[data.length - 1].x.push(k);
				for (j = 0; j < data[data.length - 1].y.length; j++)
					data[data.length - 1].x.push(k+0.1);
				var l = data[data.length - 1].x.length;
				data[data.length - 1].y.forEach((e, i) => data[data.length - 1].x.push(data[data.length - 1].x[i]+0.2))
				for (j = 0; j < l; j++)
				{
					data[data.length - 1].y.push(data[data.length - 1].y[j]);
					data[data.length - 1].z.push(data[data.length - 1].z[j]);
				}
			}
			else
			{
				data.push({
					x: proj.map(e => e[0]),
					y: proj.map(e => e[1]),
					z: proj.map(e => e[2]),
					type: 'mesh3d',
					alphahull: 0,
					color: '#ff8f00',
					hoverinfo: 'none'
				});
			}
		});
		
		this.setState({ varData: data, changed: false });
		return data;
	} // end calcVarData
	
	
	
	calcParamData()
	{
		var input = this.props.sapoParams;
		var paramNum = this.props.parameters.filter(v => v.lMatrixExtra !== true).length
		
		// initialize data var, which holds the results
		var data = [];
		
		// subspace definition, array of positions of corresponding variable
		var subspace;
		if (this.state.chartType === "2D")
			subspace = [-1,-1];
		else
			subspace = [-1,-1,-1];
		
		this.props.parameters.forEach((v, i) => {
			if (v.name === this.state.xAxis)
				subspace[0] = i;
			if (v.name === this.state.yAxis)
				subspace[1] = i;
			if (v.name === this.state.zAxis)
				subspace[2] = i;
		});
		
		if (input.length === 0)
		{
			alert("The set of parameters is empty!");
			this.setState({ paramData: [], changed: false });
			return [];
		}
		
		input.forEach(poly => {
			// find vertices
			var vertices = [];
			
			/* possible linear systems
			 * if linearSystem[i] == 1, the i-th direction is used
			 * as an equation in the linear system to find possible vertices
			 */
			var linearSystem = [];
			for (var i = 0; i < poly.directions.length; i++)
				if (i < paramNum)
					linearSystem.push(1);
				else
					linearSystem.push(0);
			
			var hasNext = true;
			while (hasNext)
			{
				var A = poly.directions.filter((item, pos) => linearSystem[pos] === 1);
				var b = poly.offsets.filter((item, pos) => linearSystem[pos] === 1);
				if (math.det(A) !== 0)
					vertices.push(math.lusolve(A, b).reduce((acc, el) => acc.concat(el), []));

				// find next linearSystem
				hasNext = findNext(linearSystem);
			}
			
			// remove vertices that violate some constraint
			var LB = [];
			poly.directions.forEach(d => LB.push(-Infinity));
			removeWrongVertices(vertices, poly.directions, LB, poly.offsets, 0);
			
			// vertices projected in the subspace
			var proj = vertices.map(e => subspace.map(i => {
				if (i !== -1) return e[i]; else return -1;
			}));
			
			if (proj.length === 0)
			{
				this.setState({ paramData: [] });
				return;
			}
			
			if (this.state.chartType === "2D")
			{
				// remove duplicate vertices, which are problematic for removeInnerVertices
				proj.sort();
				var j = 0;
				while (j+1 < proj.length)
				{
					if (compareArray(proj[j], proj[j+1]) === 0)
						proj.splice(j+1, 1);
					else
						j++;
				}
				
				// find center of polygon
				var center = [0.0, 0.0];
				proj.forEach(v => {center[0]+= v[0]; center[1] += v[1]; });
				center[0] /= proj.length;
				center[1] /= proj.length;
				
				// sort counterclockwise, starting from angle 0 (direction (1,0))
				proj.sort((p1, p2) => compare(p1, p2, center));
				
				// some vertices could be projected inside resulting polygon, remove them
				proj = removeInnerVertices(proj);
				
				if (proj.length === 1)
				{
					data.push({
						x: [proj[0][0]],
						y: [proj[0][1]],
						mode: 'markers',
						type: 'scatter',
						marker: {
							color: '#ff8f00',
							size: 7
						}
					});
				}
				else
				{
					data.push({
							x: proj.map(e => e[0]).concat([proj[0][0]]),
							y: proj.map(e => e[1]).concat([proj[0][1]]),
							mode: 'lines',
							type: 'scatter',
							fill: 'toself',
							line: {
								color: '#ff8f00',
								width: 2
							}
						});
				}
			}
			else
			{
				data.push({
					x: proj.map(e => e[0]),
					y: proj.map(e => e[1]),
					z: proj.map(e => e[2]),
					type: 'mesh3d',
					alphahull: 0,
					color: '#ff8f00',
					hoverinfo: 'none'
				});
			}
		});
		
		this.setState({ paramData: data, changed: false });
		return data;
	}
	
}	// end Chart


// return the collection of all vectors v s.t. v[i] === a[i] || v[i] === b[i]
function getCouples(a, b)
{
	var res = [[a[0]], [b[0]]];
	
	for (var i = 1; i < a.length; i++)
	{
		var acc = [];
		for (var j = 0; j < res.length; j++)
		{
			var copy = [...res[j]];
			copy.push(a[i]);
			acc.push(copy);
			res[j].push(b[i]);
		}
		res = res.concat(acc);
	}
	
	return res;
}

/*
function getCombinations(m, n)
{
	var zeroes = [], ones = [];
	for (var i = 0; i < m; i++)
	{
		zeroes.push(0);
		ones.push(1);
	}
	var As = getCouples(zeroes, ones);
	
	var res = [];
	As.forEach(v => {
		if (v.reduce((acc, val) => acc + val) === n)
			res.push(v);
	});
	return res;
}
*/

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

// removes vertices violating a constraint
function removeWrongVertices(vertices, directions, LB, UB, tol)
{
	var toRemove = [];
	vertices.forEach(v => {
		for (var i = 0; i < directions.length; i++)
		{
			if (math.dot(directions[i], v) < LB[i] - tol || math.dot(directions[i], v) > UB[i] + tol)
			{
				toRemove.push(v);
				break;
			}
		}
	});
	
	/* remove wrong vertices */
	toRemove.forEach(v => {
		var index = vertices.indexOf(v);
		vertices.splice(index, 1);
	});
}

// v is sorted counterclockwise
function removeInnerVertices(v)
{
	var i = 0;
	var a = v[v.length - 1];
	var b = v[0];
	var c = v[1];
	
	while (i < v.length)
	{
		if (v.length <= 3)
			return v;
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
			v.splice(i,1);
			b = c;
			c = v[(i+1) % v.length];
		}
		else
		{
			i++;
			a = b;
			b = c;
			c = v[(i+1) % v.length];
		}
	}
	
	return v;
}

function findNext(linearSystem)
{
//	alert("current linearSystem: " + linearSystem);
	var l = linearSystem.length - 1;
	
	if (linearSystem[l] === 0)
	{
//		alert("caso faacile");
		var i = 1;
		while (linearSystem[l-i] === 0)
			i++;
		
//		alert("trovato un 1 in posizione " + i);
		
		linearSystem[l-i] = 0;
		linearSystem[l-i+1] = 1;
	}
	else
	{
//		alert("caso difficile");
		var j = 1;
		while (j <= l && linearSystem[l-j] === 1)
			j++;
		
		j = i;
		while (j <= l && linearSystem[l-j] === 0)
			j++;
		
		if (i > l)
			return false;
		
		linearSystem[l-i] = 0;
		var pos = l-i+1;
		while (pos <= l-i+1+j)
		{
			linearSystem[pos] = 1;
			pos++;
		}
		while (pos <= l)
		{
			linearSystem[pos] = 0;
			pos++;
		}
	}
//	alert("fine");
	return true;
}
