(function () {
  'use strict';
  const root = document.getElementById('method-art');
  if (!root) return;
  const section = document.getElementById('method');
  const buttons = Array.from(section.querySelectorAll('#steps .step'));
  const equations = Array.from(section.querySelectorAll('.eqset'));
  const caption = root.querySelector('.method-art__caption');
  const model = root.querySelector('#ma-model');
  const evolution = root.querySelector('#ma-evolution-path');
  const returnVector = root.querySelector('#ma-return-vector');
  const length = evolution.getTotalLength();
  const captions = [
    'Each sample gets one symmetric pair. Average the outputs to predict.',
    'Evaluate a shortcut-resistant objective. The loss difference estimates an update direction.',
    'Evolve with anchor-guided probes and a weak pull-back. Keep learning within the same budget.'
  ];
  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = v => v * v * (3 - 2 * v);
  let current = -1;
  buttons.forEach((button, index) => {
    button.setAttribute('aria-controls', 'method-formulas-' + index);
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    equations[index].id = 'method-formulas-' + index;
  });
  function render(time) {
    const step = Math.min(2, Math.floor(Math.max(0, time) / 6));
    const local = clamp((time - step * 6) / 4.5);
    if (step !== current) {
      current = step;
      root.dataset.phase = String(step);
      caption.textContent = captions[step];
      buttons.forEach((button, index) => {
        button.classList.toggle('on', index === step);
        button.setAttribute('aria-pressed', index === step ? 'true' : 'false');
        equations[index].classList.toggle('on', index === step);
        equations[index].setAttribute('aria-hidden', index === step ? 'false' : 'true');
      });
    }
    buttons.forEach((button, index) => {
      button.querySelector('.prog i').style.width = (index < step ? 100 : index === step ? local * 100 : 0) + '%';
    });
    const progress = step === 2 ? ease(clamp((time - 12) / 4.3)) : .28;
    const point = evolution.getPointAtLength(length * progress);
    model.setAttribute('transform', 'translate(' + point.x.toFixed(2) + ' ' + point.y.toFixed(2) + ')');
    evolution.style.strokeDasharray = String(length);
    evolution.style.strokeDashoffset = String(length * (1 - progress));
    returnVector.setAttribute('d', 'M' + point.x.toFixed(2) + ' ' + point.y.toFixed(2) + 'L799 269');
    returnVector.style.opacity = step === 2 ? String(.45 + .3 * Math.sin(local * Math.PI)) : '.4';
    const activeFlows = root.querySelectorAll(step === 0 ? '.ma-input-flow,.ma-output-flow,.ma-prediction-flow' : step === 1 ? '.ma-loss-flow' : '.ma-gradient-flow');
    root.querySelectorAll('.ma-flow').forEach(flow => { flow.style.strokeOpacity = '.4'; });
    activeFlows.forEach(flow => { flow.style.strokeOpacity = String(.6 + .35 * Math.sin(local * Math.PI)); });
  }
  render(0);
  const config = { id: 'method-art', root, duration: 18, render,
    steps: [{ time: 0, label: 'Probe' }, { time: 6, label: 'Objective' }, { time: 12, label: 'Evolve' }] };
  const controller = window.EVAMotion ? window.EVAMotion.register(config) : {
    seek: render, pause: function () {}
  };
  buttons.forEach((button, index) => button.addEventListener('click', function () {
    controller.pause();
    controller.seek(index * 6);
    render(index * 6);
  }));
  root.dataset.ready = 'true';
})();
