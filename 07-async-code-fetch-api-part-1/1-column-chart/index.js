import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
    _chartHeight = 50;

    element;
    url;
    range;
    value = 0;
    data = [];
    label;
    link;

    constructor({
        url = '',
        range = {
          from: new Date(),
          to: new Date()
        },
        label = '',
        link = '',
        formatHeading = data => data } = {}
    ) {
        this.url = url;
        this.range = range;
        this.label = label;
        this.link = link;
        this.formatHeading = formatHeading;

        this.render();
        this.loadData();
    }

    render() {
        const element = document.createElement('div');
        element.innerHTML = this.getTemplate();
        this.element = element.firstElementChild;

        this.subElements = this.getUpdatedElements();
    }

    loadData() {
        const url = new URL(this.url, BACKEND_URL);
        url.searchParams.append('from', this.range.from);
        url.searchParams.append('to', this.range.to);

        return fetchJson(url)
        .then(json => {
            const data = Object.values(json);

            if (data.length) {
                this.updateChart(data);
                this.element.classList.remove('column-chart_loading');
            }
            
            return json;
        })
        .catch(error => console.error(error));
    }

    update(from = new Date(), to = new Date()) {
        this.range = {from, to};
        return this.loadData();
    }

    updateChart(data = []) {
        this.data = data;
        this.value = data.reduce((sum, value) => sum += value, 0);
        this.subElements.header.innerHTML = this.formatHeading(this.value);
        this.subElements.body.innerHTML = this.getChart();
    }

    remove() {
        this.element.remove();
    }

    destroy() {
        this.remove();
        this.element = {};
        this.updatedElements = {};
    }

    getTemplate() {
        return `
            <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
                <div class="column-chart__title">
                    Total ${this.label}
                    ${this.getLink()}
                </div>
                <div class="column-chart__container">
                    <div data-element="header" class="column-chart__header">${this.formatHeading(this.value)}</div>
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

    getLink() {
        return (this.link) 
            ? `<a href="/${this.link}" class="column-chart__link">View all</a>`
            : '';
    }

    getChart() {
        if (!this.data.length) return '';

        return this.getColumnProps(this.data)
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
