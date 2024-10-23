/* eslint-disable valid-jsdoc */
/**
 * Returns the `requestAnimationFrame` function for the browser, or a shim with
 * `setTimeout` if the function is not found
 *
 * @return {function} Available `requestAnimationFrame` function for the browser
 *//*
export default (
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (callback => setTimeout(callback, 1000 / 60))
).bind(window);
*/
const reqAnimationFrame = function (callback) {
  return setTimeout(callback, 1000 / 60); // 60fps fallback for desktop
};

export default reqAnimationFrame;