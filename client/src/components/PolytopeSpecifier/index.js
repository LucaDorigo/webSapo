// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import homestyles from "../Home/style.module.css";
import { MdClose } from "react-icons/md";

type Props = {};


const options = [{value: "=", label: "="}, 
                 {value: "in", label: "in"},
                 {value: ">=", label: ">="},
                 {value: "<=", label: "<="}];

/**
 * @param expression: constraint expression
 * @param	expressionBoundaries the constraint expression boundaries
 * @param index: index of the direction
 * @param deleteConstraint: callback to delete a constraint
 * @param changeExpression: callback to change the constraint expression
 * @param	changeRelation change constraint relation
 * @param	changeLowerBound change lower constraint boundary
 * @param	changeUpperBound change upper constraint boundary
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
              className={homestyles.boundaryInput}
              value={exprBoundaries.lowerBound}
              onChange={e =>
                this.props.changeLowerBound(e, false)
              }
              type="number"
              id={this.props.index}
              pattern="(-)?[0-9]+([\.,][0-9]+)?"
              step="0.0001"
            />}
            {(exprBoundaries.relation==="in") &&
            <p> - </p>
            }
            {(exprBoundaries.relation==="in" || exprBoundaries.relation==="<=") &&
            <input
              className={homestyles.boundaryInput}
              value={exprBoundaries.upperBound}
              onChange={e =>
                this.props.changeUpperBound(e, false)
              }
              type="number"
              id={this.props.index}
              pattern="(-)?[0-9]+([\.,][0-9]+)?"
              step="0.0001"
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
              />
            </div>
          );
        })}
      </div>
    );
  }
}
