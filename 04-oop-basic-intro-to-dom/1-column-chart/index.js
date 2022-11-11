export default class ColumnChart {

    _chartHeight = 50;

    constructor({ data = [], label = '', link = '', value = 0, formatHeading = data => data } = {}) {
        this._data = data;
        this._label = label;
        this._link = link;
        this._value = value;
        this.formatHeading = formatHeading;
        this.render();
    }

    render() {
        const element = document.createElement('div');
        element.innerHTML = this.getTemplate();
        this.element = element.firstElementChild;

        if (this.getData().length) {
            this.element.classList.remove('column-chart_loading');
        }

        this.updatedElements = this.getUpdatedElements();
    }

    update(data = []) {
        this.setData(data);
        this.updatedElements.body.innerHTML = this.getChart();
    }

    remove() {
        this.element.remove();
    }

    destroy() {
        this.remove();
    }

    getTemplate() {
        return `
            <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
                <div class="column-chart__title">
                    Total ${this.getLabel()}
                    ${this.generateLink()}
                </div>
                <div class="column-chart__container">
                    <div data-element="header" class="column-chart__header">${this.formatHeading(this.getValue())}</div>
                    <div data-element="body" class="column-chart__chart">${this.getChart()}</div>
                </div>
            </div>
        `;
    }

    getUpdatedElements() {
        const elements = [...this.element.querySelectorAll('[data-element]')];
        return Object.fromEntries(elements.map((updatedElement) => [updatedElement.dataset.element, updatedElement]));
    }

    get chartHeight() {
        return this._chartHeight;
    }

    getData() {
        return this._data;
    }
    setData(data = []) {
        this._data = data;
    }
    getLabel() {
        return this._label;
    }
    getLink() {
        return this._link;
    }
    getValue() {
        return this._value;
    }

    generateLink() {
        return (this.getLink()) 
            ? `<a href="/${this.getLink()}" class="column-chart__link">View all</a>`
            : '';
    }

    getChart() {
        if (!this.getData().length) return '';

        return this.getColumnProps(this.getData())
            .map(({percent, value}) => `<div style="--value: ${value}" data-tooltip="${percent}"></div>`)
            .join("");
    }

    getColumnProps(data) {
        const maxValue = Math.max(...data);
        const scale = this.chartHeight / maxValue;
      
        return data.map(item => {
            return {
            percent: (item / maxValue * 100).toFixed(0) + '%',
            value: String(Math.floor(item * scale))
          };
        });
    }

}
