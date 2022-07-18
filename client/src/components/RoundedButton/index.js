// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
//import { Link } from "react-router-dom";

type Props = {};

/**
 * @param callback: function executed on button click
 * @param text: text to display inside the button
 * @param parameter: callback parameter
 * @param notClickable: true|false value to enable|disable button
 */

export default class RoundedButton extends Component<Props> {
  props: Props;

  render() {
    return (
      <button
        onClick={() => this.props?.callback?.(this.props?.parameter)}
        className={(this.props.className===undefined ? styles.button: this.props.className)}
        disabled={this.props.notClickable}
      >
        <p>{this.props.text}</p>
      </button>
    );
  }
}
