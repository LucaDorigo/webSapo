import { AppContainer } from "react-hot-loader";
import React from "react";
import { render } from "react-dom";
import { configureStore, history } from "./store/configureStore";
import Home from "./containers/Home";

const store = configureStore();

// remove console log in production
if (process.env.NODE_ENV === "production" ) {
   console.log = () => {};
}

render(
  <AppContainer>
    <Home store={store} history={history} />
  </AppContainer>,
  document.getElementById("root")
); // basic way of using store

if (module.hot) {
  module.hot.accept("./containers/Home", () => {
    // eslint-disable-next-line global-require
    const NextRoot = require("./containers/Home").default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById("root")
    );
  });
}
