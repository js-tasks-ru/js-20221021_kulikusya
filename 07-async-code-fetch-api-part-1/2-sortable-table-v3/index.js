import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {

  _maxDataLoad = 30;

  _comparisons = {
    string: (s1, s2) => String(s1).localeCompare(String(s2), ['ru', 'en'], {caseFirst: 'upper'}),
    number: (n1, n2) => Number(n1) - Number(n2),
  };

  element;

  headers;
  headersMap;
  headerIds;

  data = [];

  url;
  isSortLocally;
  sorted;

  constructor(headersConfig, 
    {
      url = '',
      isSortLocally = false,
      sorted = {
        id: headersConfig.find(item => item.sortable).id,
        order: 'asc'
      }
    } = {},
    comparisons = []) {

    this.headers = headersConfig.map(headerConfig => this.generateHeader(headerConfig));
    this.headersMap = new Map(this.headers.map(header => [header.id, header]));    
    this.headerIds = [...this.headersMap.keys()];

    this.url = url;
    this.isSortLocally = isSortLocally;
    this.sorted = sorted;

    comparisons.forEach(compare => this.setNewCompare(compare));

    this.render();
  }

  render() {
    const tableWrapper = document.createElement('div');
    tableWrapper.innerHTML = this.getTableTemplate(this.headers, this.data);

    this.element = tableWrapper.firstElementChild;
    
    this.subElements = this.getSubElements(this.element);

    this.subElements.header.addEventListener('pointerdown', this.headerOnClick);
    window.addEventListener('scroll', this.onScroll);

    this.updateTableHeaderWithSort();

    return this.loadData(this.getUrl())
      .then(() => {
        this.updateBody();
        return this.element;
      })
  }

  getSubElements(tableElement) {
    return Object.fromEntries(
      [...tableElement.querySelectorAll('[data-element]')]
        .map(dataElement => [dataElement.dataset.element, dataElement])
    );
  }

  getUrl() {
    const url = new URL(this.url, BACKEND_URL);
    url.searchParams.append("_sort", this.sorted.id);
    url.searchParams.append("_order", this.sorted.order);

    url.searchParams.append('_start', this.data.length);
    url.searchParams.append('_end', this.data.length + this._maxDataLoad);
    return url;
  }
  
  loadData(url) {
    return fetchJson(url)
    .then((json => {
      const loadedData = this.getDataForTable(json);
        this.data.push(...this.getDataForTable(json));
        this.dataLoaded = this.data.length;
        return loadedData;
    }));
  }

  getDataForTable = (rawData = []) => {
    return rawData.map(item => Object.fromEntries(['id', ...this.headerIds].map(key => [key, item[key]])));
  }

  onScroll = () => {
    const currentScroll = window.pageYOffset + document.documentElement.clientHeight;
    const pageHeight = document.documentElement.scrollHeight;
    const scrollTriggerZone = 200;
    if ( currentScroll < pageHeight - scrollTriggerZone) return;

    window.removeEventListener('scroll', this.onScroll);

    this.loadData(this.getUrl())
      .then((data) => {
        this.updateBody(data);
        window.addEventListener('scroll', this.onScroll);
        return this.element;
      })
  }

  headerOnClick = (event) => {
    const column = event.target.closest('[data-sortable="true"]');

    if (!column || !this.subElements.header.contains(column)) {
      return;
    }

    const toggleOrder = (order = 'asc') => {
      return {asc: 'desc', desc: 'asc'}[order];
    }

    this.sort(column.dataset.id, toggleOrder(column.dataset.order));
  }


  sort = (id, order, isSortLocally = this.isSortLocally) => {
    this.sorted = {id, order};
    this.updateTableHeaderWithSort();

    this.element.classList.add("sortable-table_loading");
    this.subElements.body.innerHTML = '';

    let sortResult;
    if (isSortLocally) {
      sortResult = this.sortOnClient(id, order);
    } else {
      sortResult = this.sortOnServer(id, order);
    }

    return sortResult
    .then( () => {
      this.updateBody();      
      return this.element;
    })
  }

  sortOnServer = (id, order) => {
    this.data = [];
    return this.loadData(this.getUrl());
  }

  
  sortOnClient(id = '', order = '') {
    const sortDirections = {asc: 1, desc: -1};
    if (!Object.hasOwn(sortDirections, order)) {
      throw new Error(`Unknown parameter 'param': '${order}' !`);
    }
    if (!this.headersMap.has(id)) {
      throw new Error(`There is no field = ${id}`);
    }
    if (!this.headersMap.get(id).sortable) {
      throw new Error(`This field ('${id}) is not sortable`);
    }

    const sortType = this.headersMap.get(id).sortType;
    this.data.sort((item1, item2) => sortDirections[order] * this.getCompare(sortType)(item1[id], item2[id]));

    return new Promise((resolve) => resolve(this.data));
  }


  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = null;
  }

  updateBody(data = this.data) {
    this.element.classList.remove("sortable-table_loading");
    if (this.data.length) {
      const rowsWrapper = document.createElement('div');
      rowsWrapper.innerHTML = this.getBodyRowsTemplate(this.headers, data);
      this.subElements.body.append(...rowsWrapper.childNodes);
    } else {
      this.element.classList.add("sortable-table_empty");
    }
  }

  updateTableHeaderWithSort() {
    if (!this.sorted) {
      return;
    }

    this.subElements.header.querySelectorAll(`[data-order]`).forEach(fieldElement => fieldElement.removeAttribute('data-order'));
    this.subElements.header.querySelectorAll('.sortable-table__sort-arrow').forEach(arrow => arrow.remove());

    const sortedHeaderField = this.subElements.header.querySelector(`[data-id="${this.sorted.id}"]`);
    sortedHeaderField.dataset.order = this.sorted.order;
    sortedHeaderField.insertAdjacentHTML('beforeend', this.getHeaderArrowTemplate());
  }

  getTableTemplate(headers = [], data = []) {
    return `
      <div class="sortable-table sortable-table_loading">
        ${this.getHeadersRowTemplate(headers)}
        ${this.getBodyTemplate(headers, data)}
        ${this.getLoadingLine()}
        ${this.getPlaceholder()}
      </div>
    `;
  }

  getHeadersRowTemplate(headers = []) {
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.getHeaderCellsTemplate(headers)}
      </div>
    `;
  }
  getHeaderCellsTemplate(headers = []) {
    return headers.map(header => this.getHeaderCellTempate(header)).join('');
  }
  getHeaderCellTempate({id = '', title = '', sortable = false} = {}) {
    return `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
        <span>${title}</span>
      </div>
    `;
  }

  getBodyTemplate(headers = [], data = []) {
    return `
      <div data-element="body" class="sortable-table__body">
        ${this.getBodyRowsTemplate(headers, data)}
      </div>
    `;
  }

  getBodyRowsTemplate(headers = [], data = []) {
    return data.map(item => this.getBodyRowTemplate(headers, item)).join('');
  }
  getBodyRowTemplate(headers = [], data = {}) {
    return `
      <a href="/products/3d-ochki-epson-elpgs03" class="sortable-table__row">
        ${headers.map(header => header.template(data[header.id])).join('')}
      </a>
    `;
  }

  getBodyCellTemplate(value = '') {
    return `<div class="sortable-table__cell">${value}</div>`;
  }

  getHeaderArrowTemplate() {
    return `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    `;
  }

  getLoadingLine() {
    return `
      <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
    `;
  }

  getPlaceholder() {
    return `
    <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
      <div>
        <p>No products satisfies your filter criteria</p>
        <button type="button" class="button-primary-outline">Reset all filters</button>
      </div>
    </div>
    `
  }

  generateHeader = ({id = '', title = '', sortable = false, sortType = 'string', template = this.getBodyCellTemplate} = {}) => {
    return {id, title, sortable, sortType, template};
  }

  getAllComparisons() {
    return this._comparisons;
  }
  getCompare(type = 'string') {
    return this.getAllComparisons()[type];
  }
  setNewCompare({type, compareFunction} = {}) {
    if (!type || !compareFunction) {
      console.error("Type or compare function are not defined");
      return;
    }
    this.getAllComparisons()[type] = compareFunction;
  }
}
