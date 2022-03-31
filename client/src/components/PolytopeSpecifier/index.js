// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import homestyles from "../Home/style.module.css";
import { MdClose } from "react-icons/md";
import classNames from 'classnames/bind';

type Props = {};


const options = [{value: "=", label: "="}, 
                 {value: "in", label: "in"},
                 {value: ">=", label: ">="},
                 {value: "<=", label: "<="}];


let hstyles = classNames.bind(homestyles);

/**
 * @param expression: constraint expression
 * @param	expressionBoundaries the constraint expression boundaries
 * @param index: index of the direction
 * @param deleteConstraint: callback to delete a constraint
 * @param changeExpression: callback to change the constraint expression
 * @param	changeRelation change constraint relation
 * @param	changeLowerBound change lower constraint boundary
 * @param	changeUpperBound change upper constraint boundary
 * @param	changedLowerBound check lower bound and update upper bound if needed
 * @param	changedUpperBound check upper bound and update lower bound if needed
 */
export class Constraints extends Component<Props> {
  props: Props;

  render() {
    let exprBoundaries = this.props.expressionBoundaries[this.props.index];
    return (
          <div className={styles.constraint}>
            <MdClose
              size={20}
              className={styles.icon}
              onClick={(e) => {
                this.props.deleteConstraint(this.props.index);}}
            />
            <p className={homestyles.smallFont}>{this.props.index+1}:&nbsp;</p>
            <input className={homestyles.equation} 
              type="text"
              value={this.props.expression}
              onChange={(e) => this.props.changeExpression(e, this.props.index)}
              />
            <select onChange={e => {
              this.props.changeRelation(e, this.props.index);
            }}
              value={exprBoundaries.relation}>
              {options.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
            {(exprBoundaries.relation==="in" || exprBoundaries.relation===">=" || 
              exprBoundaries.relation==="=") &&
            <input
              className={hstyles('boundaryInput', {
                error: exprBoundaries.lb_error
              })}
              value={exprBoundaries.lowerBound}
              onBlur={e => 
                this.props.changedLowerBound(e, false)
              }
              onChange={e =>
                this.props.changeLowerBound(e, false)
              }
              type="text"
              id={this.props.index}
            />}
            {(exprBoundaries.relation==="in") &&
            <p> - </p>
            }
            {(exprBoundaries.relation==="in" || exprBoundaries.relation==="<=") &&
            <input
              className={hstyles('boundaryInput', {
                error: exprBoundaries.ub_error
              })}
              value={exprBoundaries.upperBound}
              onBlur={e => 
                this.props.changedUpperBound(e, false)
              }
              onChange={e =>
                this.props.changeUpperBound(e, false)
              }
              type="text"
              id={this.props.index}
            />
            }
        </div>
    );
  }
}

/**
 * @param expressions the constraint expression vector
 * @param	expressionBoundaries the constraint expression boundaries
 * @param deleteConstraint: callback to delete a constraint
 * @param changeExpression: callback to change the constraint expression
 * @param	changeRelation change constraint relation
 * @param	changeLowerBound change lower constraint boundary
 * @param	changeUpperBound change upper constraint boundary
 * @param	changedLowerBound check lower bound and update upper bound if needed
 * @param	changedUpperBound check upper bound and update lower bound if needed
 */
export default class PolytopeSpecifier extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.polytopeContainer}>
        {this.props.expressions.map((expression, index) => {
          return (
            <div key={index} className={styles.constrContainer}>
              <Constraints
                expression={expression}
                expressionBoundaries={this.props.expressionBoundaries}
                index={index}
                deleteConstraint={this.props.deleteConstraint}
                changeExpression={this.props.changeExpression}
                changeRelation={this.props.changeRelation}
                changeUpperBound={this.props.changeUpperBound}
                changeLowerBound={this.props.changeLowerBound}
                changedLowerBound={this.props.changedLowerBound}
                changedUpperBound={this.props.changedUpperBound}
              />
            </div>
          );
        })}
      </div>
    );
  }
}
