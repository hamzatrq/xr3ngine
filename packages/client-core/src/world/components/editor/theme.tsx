import React from "react";

/**
 * theme is common component used for providing common UI properties.
 * 
 * @author Robert Long
 * @type {Object}
 */
const theme = {
  a: "",
  lato: "'Lato', sans-serif",
  zilla: "'Zilla Slab', sans-serif",
  background: "#15171B",
  inputBackground: "#070809",
  border: "#5D646C",
  panel: "#282C31",
  panel2: "#3A4048",
  selected: "#006EFF",
  selectedText: "#fff",
  hover: "#4B5562",
  hover2: "#636F80",
  text: "#FFFFFF",
  text2: "#9FA4B5",
  dropdown: "#000000",
  red: "#F44336",
  pink: "#E91E63",
  purple: "#9C27B0",
  deepPurple: "#673AB7",
  indigo: "#3F51B5",
  blue: "#006EFF",
  lightBlue: "#03A9F4",
  cyan: "#00BCD4",
  teal: "#009688",
  green: "#4CAF50",
  lightGreen: "#8BC34A",
  lime: "#CDDC39",
  yellow: "#FFEB3B",
  amber: "#FFC107",
  orange: "#FF9800",
  deepOrange: "#FF5722",
  brown: "#795548",
  blueHover: "#4D93F1",
  bluePressed: "#0554BC",
  disabled: "#222222",
  disabledText: "grey",
  deemphasized: "grey",
  toolbar: "#4D535B",
  toolbar2: "#43484F",
  header: "#1b1b1b",
  white: "#fff",
  shadow15: "0px 4px 4px  rgba(0, 0, 0, 0.15)",
  shadow30: "0px 4px 4px  rgba(0, 0, 0, 0.3)",
  borderStyle: "1px solid #5D646C"
};

/**
 * theme creating color chart for application.
 * 
 * @author Robert Long
 * @type {Object}
 */
theme["chartColors"] = [
  theme.red,
  theme.pink,
  theme.purple,
  theme.deepPurple,
  theme.indigo,
  theme.blue,
  theme.lightBlue,
  theme.cyan,
  theme.teal,
  theme.green,
  theme.lightGreen,
  theme.lime,
  theme.yellow,
  theme.amber,
  theme.orange,
  theme.deepOrange,
  theme.brown
];

export const ThemeContext = React.createContext(theme);

export type Theme = typeof theme

export default theme;
