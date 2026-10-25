/* Site Guide greeting only. The existing shared scripts handle navigation,
   appearance, search, page contents and footer dates.
   EDIT: The complete welcome and page links are in site-guide.html. */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';
  var root = document.getElementById('site-guide-content');
  if (!root) return;
  var replay = root.querySelector('[data-wave]');
  var arm = root.querySelector('.sg-arm');
  var face = root.querySelector('.sg-face');
  var bubble = root.querySelector('.sg-dialogue');
  var eyes = Array.from(root.querySelectorAll('.sg-eye'));
  var parts = [arm, face, bubble].concat(eyes);
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var canAnimate = typeof arm.animate === 'function';

  function stop() {
    parts.forEach(function (part) {
      if (typeof part.getAnimations === 'function') {
        part.getAnimations().forEach(function (animation) { animation.cancel(); });
      }
    });
  }
  function syncMotion() {
    replay.disabled = reduced.matches || !canAnimate;
    replay.setAttribute('aria-label', replay.disabled ? 'Portrait of Deep Makadiya' : 'Deep waves hello — click to replay the greeting');
    if (replay.disabled) stop();
  }
  function playGreeting() {
    if (reduced.matches || !canAnimate) return;
    stop();
    arm.animate([
      {transform:'rotate(8deg)',offset:0},
      {transform:'rotate(-4deg)',offset:.14},
      {transform:'rotate(18deg)',offset:.28},
      {transform:'rotate(0deg)',offset:.42},
      {transform:'rotate(16deg)',offset:.56},
      {transform:'rotate(8deg)',offset:.74},
      {transform:'rotate(8deg)',offset:1}
    ], {duration:1800,easing:'ease-in-out'});
    face.animate([
      {transform:'rotate(-2deg)',offset:0},
      {transform:'rotate(2deg)',offset:.35},
      {transform:'rotate(-2deg)',offset:.7},
      {transform:'rotate(-2deg)',offset:1}
    ], {duration:1800,easing:'ease-in-out'});
    eyes.forEach(function (eye) {
      eye.animate([
        {transform:'scaleY(1)',offset:0},
        {transform:'scaleY(1)',offset:.35},
        {transform:'scaleY(.1)',offset:.39},
        {transform:'scaleY(1)',offset:.44},
        {transform:'scaleY(1)',offset:.8},
        {transform:'scaleY(.1)',offset:.84},
        {transform:'scaleY(1)',offset:.89},
        {transform:'scaleY(1)',offset:1}
      ], {duration:1800,easing:'linear'});
    });
    bubble.animate([
      {transform:'translateY(7px) scale(.99)'},
      {transform:'translateY(0) scale(1)'}
    ], {duration:450,easing:'ease-out'});
  }
  replay.addEventListener('click', playGreeting);
  if (typeof reduced.addEventListener === 'function') reduced.addEventListener('change', syncMotion);
  else if (typeof reduced.addListener === 'function') reduced.addListener(syncMotion);
  syncMotion();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(playGreeting);
  else playGreeting();

});
