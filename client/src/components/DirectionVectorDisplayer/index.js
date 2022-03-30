// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import homestyles from "../Home/style.module.css";
import { MdClose } from "react-icons/md";

type Props = {};

/**
 * @param direction: direction equation
 * @param initialDirBoundaries: initial boundaries
 * @param index: index of the direction
 * @param deleteDirection: callback to delete the direction
 * @param changeDirection: callback to change the direction
 * @param	changeRelation change boundary relation
 * @param	changeLowerBound change lower direction boundary function
 * @param	changeUpperBound change upper direction boundary function
 */

const options = [{value: "=", label: "="}, 
                 {value: "in", label: "in"},
                 {value: ">=", label: ">="},
                 {value: "<=", label: "<="}];

export class DirectionRows extends Component<Props> {
  props: Props;

  render() {
    let dirBoundaries = this.props.dirBoundaries[this.props.index];
    return (
          <div className={styles.rowDirection}>
            <MdClose
              size={20}
              className={styles.icon}
              onClick={(e) => {
                this.props.deleteDirection(this.props.index);}}
            />
            <p className={homestyles.smallFont}>{this.props.index+1}:&nbsp;</p>
            <input className={homestyles.equation} 
              type="text"
              value={this.props.direction}
              onChange={(e) => this.props.changeDirection(e, this.props.index)}
              />
            <select onChange={e => {
              this.props.changeRelation(e, this.props.index);
            }}
              value={dirBoundaries.relation}>
              {options.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
            {(dirBoundaries.relation==="in" || dirBoundaries.relation===">=" || 
              dirBoundaries.relation==="=") &&
            <input
              className={homestyles.boundaryInput}
              value={dirBoundaries.lowerBound}
              onChange={e =>
                this.props.changeLowerBound(e, false)
              }
              type="number"
              id={this.props.index}
              pattern="(-)?[0-9]+([\.,][0-9]+)?"
              step="0.0001"
            />}
            {(dirBoundaries.relation==="in") &&
            <p> - </p>
            }
            {(dirBoundaries.relation==="in" || dirBoundaries.relation==="<=") &&
            <input
              className={homestyles.boundaryInput}
              value={dirBoundaries.upperBound}
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
 * @param variables the variable list
 * @param directions the directions vector
 * @param deleteDirection: callback to delete the direction
 * @param changeDirection: callback to change the direction
 * @param	initialDirBoundaries the initial direction boundaries
 * @param	changeRelation change boundary relation
 * @param	changeLowerBound change lower direction boundary function
 * @param	changeUpperBound change upper direction boundary function
 * @param	changeDirection change direction function
 * @param	deleteDirection delete direction function
 */

export default class DirectionVectorDisplayer extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.dirContainer}>
        {this.props.directions.map((direction, index) => {
          return (
            <div key={index} className={styles.rowContainer}>
              <DirectionRows
                direction={direction}
                dirBoundaries={this.props.initialDirBoundaries}
                index={index}
                deleteDirection={this.props.deleteDirection}
                changeDirection={this.props.changeDirection}
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
