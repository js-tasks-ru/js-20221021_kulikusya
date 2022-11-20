import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {

  _comparisons = {
    string: (s1, s2) => String(s1).localeCompare(String(s2), ['ru', 'en'], {caseFirst: 'upper'}),
    number: (n1, n2) => Number(n1) - Number(n2),
  };

  element;

  headers;
  headersMap;
  headerIds;

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

    this.updateTableHeaderWithSort();
    return this.sort(this.sorted.id, this.sorted.order, false);
  }

  getSubElements(tableElement) {
    return Object.fromEntries(
      [...tableElement.querySelectorAll('[data-element]')]
        .map(dataElement => [dataElement.dataset.element, dataElement])
    );
  }

  headerOnClick = (event) => {
    const column = event.target.closest('[data-sortable="true"]');

    //check element
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

    let sortResult;
    if (isSortLocally) {
      sortResult = this.sortOnClient(id, order);
    } else {
      sortResult = this.sortOnServer(id, order);
    }

    return sortResult
    .then( () => {
      this.updateTable();      
      return this.element;
    })
  }

  updateTable() {
    this.element.classList.remove("sortable-table_loading");
    if (this.data.length) {
      this.subElements.body.innerHTML = this.getBodyRowsTemplate(this.headers, this.data);
    } else {
      this.element.classList.add("sortable-table_empty");
    }
  }


  sortOnClient = (id, order) => {
    return new Promise((resolve, reject) => {
      this.sortData(id, order);
      resolve();
    })
  }
  sortOnServer = (id, order) => {
    const url = new URL(this.url, BACKEND_URL);
    url.searchParams.append("_sort", id);
    url.searchParams.append("_order", order);

    return this.loadData(url);
  }
  
  sortData(id = '', order = '') {
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
    this.data.sort((item1, item2) => {
      return sortDirections[order] * this.getCompare(sortType)(item1[id], item2[id]);
    });
    this.sorted = {id, order};
  }

//?from=2022-10-20T13%3A54%3A23.938Z&to=2022-11-19T13%3A54%3A23.938Z&_sort=title&_order=asc&_start=0&_end=30
  
  loadData(url = '') {
    return fetchJson(url)
    .then((json => {

      this.data = json.map(item => Object.fromEntries(['id', ...this.headerIds].map(key => [key, item[key]])));

      return json;
    }));
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
