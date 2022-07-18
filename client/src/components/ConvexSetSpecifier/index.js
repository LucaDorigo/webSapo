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
 * @param constraint: the constraint
 * @param index: index of the constraint in the constraint vector
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
              value={this.props.constraint.expression}
              onChange={(e) => this.props.changeExpression(e, this.props.index)}
              />
            <select onChange={e => {
              this.props.changeRelation(e, this.props.index);
            }}
              value={this.props.constraint.relation}>
              {options.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
            {(this.props.constraint.relation==="in" || this.props.constraint.relation===">=" || 
              this.props.constraint.relation==="=") &&
            <input
              className={hstyles('boundaryInput', {
                error: this.props.constraint.lb_error
              })}
              value={this.props.constraint.lowerBound}
              onBlur={e => 
                this.props.changedLowerBound(e)
              }
              onChange={e =>
                this.props.changeLowerBound(e)
              }
              type="text"
              id={this.props.index}
            />}
            {(this.props.constraint.relation==="in") &&
            <p> - </p>
            }
            {(this.props.constraint.relation==="in" || this.props.constraint.relation==="<=") &&
            <input
              className={hstyles('boundaryInput', {
                error: this.props.constraint.ub_error
              })}
              value={this.props.constraint.upperBound}
              onBlur={e => 
                this.props.changedUpperBound(e)
              }
              onChange={e =>
                this.props.changeUpperBound(e)
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
 * @param constraints the constraint vector
 * @param deleteConstraint: callback to delete a constraint
 * @param changeExpression: callback to change the constraint expression
 * @param	changeRelation change constraint relation
 * @param	changeLowerBound change lower constraint boundary
 * @param	changeUpperBound change upper constraint boundary
 * @param	changedLowerBound check lower bound and update upper bound if needed
 * @param	changedUpperBound check upper bound and update lower bound if needed
 */
export default class ConvexSetSpecifier extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.polytopeContainer}>
        {this.props.constraints.map((constraint, index) => {
          return (
            <div key={index} className={styles.constrContainer}>
              <Constraints
                constraint={constraint}
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
