export default class ColumnChart {

    _chartHeight = 50;

    constructor(chartData) {
        this._chartData = chartData;
        this.render();
    }

    render() {
        const element = document.createElement('div');
        element.innerHTML = this.getChartData() ? this.getTemplate() : this.getLoadingFillerTemplate();
        this.element = element.firstElementChild;
    }

    update(data = []) {
        this.getChartData().data = data;
        this.render();
    }

    remove() {
        this.element.remove();
    }

    destroy(){
        this.remove();
    }



    getLoadingFillerTemplate() {
        return '<div class="column-chart_loading"></div>'
    }

    getTemplate() {
        return `
        <div class="dashboard__chart_${this.getChartData().label}">
            <div class="${this.generateColumnChartClass()}" style="--chart-height: ${this.chartHeight}">
                <div class="column-chart__title">
                    ${this.generateTitle()}
                    ${this.generateLink()}
                </div>
                <div class="column-chart__container">
                    ${this.generateValue()}
                    <div data-element="body" class="column-chart__chart">
                        ${this.getChart()}
                    </div>
                </div>
            </div>
        </div>`
    }

    get chartHeight() {
        return this._chartHeight;
    }

    getChartData() {
        return this._chartData;
    }

    generateColumnChartClass() {
        const {data = []} = this.getChartData();
        return `column-chart${data.length === 0 ? ' column-chart_loading' : ''}`
    }

    generateTitle() {
        if (!this.getChartData().label) return '';
        return `Total ${this.getChartData().label}`;
    }
    generateLink() {
        if (!this.getChartData().link) return '';
        return `<a href="/${this.getChartData().link}" class="column-chart__link">View all</a>`;
    }
    generateValue() {
        if (!this.getChartData().value) return '';
        return `<div data-element="header" class="column-chart__header">${this.getFormatValue()}</div>`
    }

    getFormatValue() {
        return (this.getChartData().formatHeading) 
            ? this.getChartData().formatHeading(this.getChartData().value) 
            : this.getChartData().value;
    }

    getChart() {
        const {data = []} = this.getChartData();
        if (data.length === 0) return '';

        return this.getColumnProps(this.getChartData().data)
            .map(({percent, value}) => `<div style="--value: ${value}" data-tooltip="${percent}"></div>`)
            // .reduce((result, div) => result += div);
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
