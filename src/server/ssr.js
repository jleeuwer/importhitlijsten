// import React from "react";
// import { renderToString } from "react-dom/server";
// import App from "../ui/App.jsx";

// export function renderApp(url, initialState) {
//   const html = renderToString(<App url={url} initialState={initialState} />);
//   return html;
// }
import React from "react";
import { renderToString } from "react-dom/server";
import App from "../ui/App.jsx";

export function renderApp(url, initialState) {
  return renderToString(
    React.createElement(App, { url, initialState })
  );
}
