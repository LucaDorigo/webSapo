// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import { Link } from "react-router-dom";

type Props = {};

/**
 * @param callback: function executed on button click
 * @param text: text to display inside the button
 * @param parameter: true|false value to distinguish between variables and parameters
 * @param notClickable: true|false value to enable|disable button
 */

export default class RoundedButton extends Component<Props> {
  props: Props;

  render() {
    return (
      <button
        onClick={() => this.props?.callback?.(this.props?.parameter)}
        className={styles.button}
        disabled={this.props.notClickable}
      >
        <p>{this.props.text}</p>
      </button>
    );
  }
}
