// @flow
import React, { Component } from 'react';
import styles from './style.module.css';
//import { Link } from 'react-router-dom';

type Props = {};

/**
 * @param variableName: name of the variable
 * @param equation: equation to display
 * @param updateEquation: callback to update the equation value
 * @param index: index of the equation in the JSON array
 */

export default class EquationRow extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.flexRow}>
        <p className={styles.flexEquation}>{this.props.variableName}(k+1)&nbsp;=</p>
        <input className={styles.textInput} type="text" value={this.props.equation} onChange={this.props.updateEquation} id={this.props.index}/>
      </div>
    );
  }
}
