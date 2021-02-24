import React, { Component, Fragment } from "react";
import style from "./style.module.css";

type Props = {};

export default class LogicButtons extends Component<Props> {
  props: Props;

  render() {
    return (
      <Fragment>
        <button
          id="AND"
          title="Logical AND"
          className={style.button_style}
          onClick={() => {
            this.props.injectTextInLogicFormula("∧");
          }}
        >
          <p className={style.button_text}>&#x2227;</p>
        </button>

        <button
          id="OR"
          title="Logical OR"
          className={style.button_style}
          onClick={() => {
            this.props.injectTextInLogicFormula("∨");
          }}
        >
          <p className={style.button_text}>&#x2228;</p>
        </button>

        <button
          id="NOT"
          title="Logical NOT"
          className={style.button_style}
          onClick={() => {
            this.props.injectTextInLogicFormula("¬");
          }}
        >
          <p className={style.button_text}>&#xac;</p>
        </button>

        <button
          className={style.button_style}
          id="Globally"
          title="Globally/Always"
          onClick={() => {
            this.props.injectTextInLogicFormula("G_[a,b]()");
          }}
        >
          <p className={style.button_text}>
            G<sub>&#x5b; a,b &#x5d;</sub>f
          </p>
        </button>

        <button
          id="Finally"
          title="Finally/Eventualy"
          className={style.button_style}
          onClick={() => {
            this.props.injectTextInLogicFormula("F_[a,b]()");
          }}
        >
          <p className={style.button_text}>
            F<sub>&#x5b; a,b &#x5d;</sub>f
          </p>
        </button>

        <button
          id="Until"
          title="Until"
          className={style.button_style}
          onClick={() => {
            this.props.injectTextInLogicFormula("()_U_[a,b]()");
          }}
        >
          <p className={style.button_text}>
            f<sub>1</sub> U <sub>&#x5b; a,b &#x5d;</sub>f<sub>2</sub>
          </p>
        </button>
      </Fragment>
    );
  }
}
