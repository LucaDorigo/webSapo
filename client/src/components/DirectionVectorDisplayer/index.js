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
 * @param	changeLowerBound change lower direction boundary function
 * @param	changeUpperBound change upper direction boundary function
 */

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
            <input className={styles.direction} 
              type="text"
              value={this.props.direction}
              onChange={(e) => this.props.changeDirection(e, this.props.index)}
              />
            <p className={homestyles.smallFont}>in</p>
            <input
              className={homestyles.textInput}
              value={dirBoundaries.lowerBound}
              onChange={e =>
                this.props.changeLowerBound(e, false)
              }
              type="number"
              id={this.props.index}
              pattern="(-)?[0-9]+([\.,][0-9]+)?"
              step="0.0001"
            />
            <p> - </p>
            <input
              className={homestyles.textInput}
              value={dirBoundaries.upperBound}
              onChange={e =>
                this.props.changeUpperBound(e, false)
              }
              type="number"
              id={this.props.index}
              pattern="(-)?[0-9]+([\.,][0-9]+)?"
              step="0.0001"
            />
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
