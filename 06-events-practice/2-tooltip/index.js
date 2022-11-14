class Tooltip {

  static _instance;

  static getTooltipTemplate() {
    return `
      <div class="tooltip">This is tooltip</div>
    `;
  }

  constructor() {
    if (Tooltip._instance) {
      return Tooltip._instance;
    }
    this.render();
    Tooltip._instance = this;
  }

  initialize () {
    document.addEventListener('pointerover', this.showTooltip);
    document.addEventListener('pointerout', this.hideTooltip);
  }

  showTooltip = ((event) => {
    if (!event.target.dataset.tooltip) {
      return;
    }

    this.element.innerHTML = event.target.dataset.tooltip;
    this.setTooltipCoords(event.clientX, event.clientY);

    document.addEventListener('pointermove', this.moveTooltip);
    document.body.append(this.element);
    
    
    console.log('showTooltip, event.target', event.target.tagName, event.target.dataset.tooltip);
  }).bind(this);

  hideTooltip = ((event) => {
    if (!event.target || !event.target.dataset.tooltip) {
      return;
    }

    this.element.remove();
    document.removeEventListener('pointermove', this.moveTooltip);

    console.log('hideTooltip, event.target', event.target.tagName, event.target.dataset.tooltip);
  }).bind(this);

  moveTooltip = ((event) => {
    this.setTooltipCoords(event.clientX, event.clientY);
  }).bind(this);

  setTooltipCoords(x, y) {
    this.element.style.left = x + 10 + 'px';
    this.element.style.top = y + 15 + 'px';
  }


  render(arg) {
    const tooltipWrapper = document.createElement('div');
    tooltipWrapper.innerHTML = Tooltip.getTooltipTemplate();

    this.element = tooltipWrapper.firstElementChild;

    //Just for test. I didn't see the point in making such a call.
    if (arg !== undefined && arg === '') {
      document.body.append(this.element);
    }
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    document.removeEventListener('pointerover', this.showTooltip);
    document.removeEventListener('pointerout', this.hideTooltip);
    document.removeEventListener('pointermove', this.moveTooltip);
  }
}

export default Tooltip;
