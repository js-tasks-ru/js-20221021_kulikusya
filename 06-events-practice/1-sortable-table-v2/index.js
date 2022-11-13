export default class SortableTable {


  static getTableTemplate(headers = [], data = []) {
    return `
      <div class="sortable-table">
        ${SortableTable.getHeadersRowTemplate(headers)}
        ${SortableTable.getBodyTemplate(headers, data)}
      </div>
    `;
  }

  static getHeadersRowTemplate(headers = []) {
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${SortableTable.getHeaderCellsTemplate(headers)}
      </div>
    `;
  }
  static getHeaderCellsTemplate(headers = []) {
    return headers.map(header => SortableTable.getHeaderCellTempate(header)).join('');
  }
  static getHeaderCellTempate({id = '', title = '', sortable = false} = {}) {
    return `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
        <span>${title}</span>
      </div>
    `;
  }

  static getBodyTemplate(headers = [], data = []) {
    return `
      <div data-element="body" class="sortable-table__body">
        ${SortableTable.getBodyRowsTemplate(headers, data)}
      </div>
    `;
  }

  static getBodyRowsTemplate(headers = [], data = []) {
    return data.map(item => SortableTable.getBodyRowTemplate(headers, item)).join('');
  }
  static getBodyRowTemplate(headers = [], data = {}) {
    return `
      <a href="/products/3d-ochki-epson-elpgs03" class="sortable-table__row">
        ${headers.map(header => header.template(data[header.id])).join('')}
      </a>
    `;
  }

  static getBodyCellTemplate(value = '') {
    return `<div class="sortable-table__cell">${value}</div>`;
  }

  static getHeaderArrowTemplate() {
    return `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    `;
  }

  static generateHeader = ({id = '', title = '', sortable = false, sortType = 'string', template = SortableTable.getBodyCellTemplate} = {}) => {
    return {id, title, sortable, sortType, template};
  }


  element;
  subElements;

  headers;
  headersMap;
  headerIds;

  _sortedField;
  getSortedField() {
    return this._sortedField;
  }
  setSortedField(field, order) {
    this._sortedField = {fieldName: field, order};
  }

  _comparisons = {
    string: (s1, s2) => String(s1).localeCompare(String(s2), ['ru', 'en'], {caseFirst: 'upper'}),
    number: (n1, n2) => Number(n1) - Number(n2),
  };
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

  constructor(headersConfig, {data = [], sorted} = {}, comparisons = []) {
    this.headers = headersConfig.map(headerConfig => SortableTable.generateHeader(headerConfig));
    this.headersMap = new Map(this.headers.map(header => [header.id, header]));    
    this.headerIds = [...this.headersMap.keys()];

    this.data = data.map(item => Object.fromEntries(['id', ...this.headerIds].map(key => [key, item[key]])));

    comparisons.forEach(compare => this.setNewCompare(compare));

    if (sorted) {
      this.sortData(sorted.id, sorted.order);
    }
    
    this.render();
  }

  render() {
    const tableWrapper = document.createElement('div');
    tableWrapper.innerHTML = SortableTable.getTableTemplate(this.headers, this.data);

    this.element = tableWrapper.firstElementChild;
    
    this.subElements = this.getSubTableElements(this.element);

    this.updateTableHeaderWithSort();

    this.subElements.header.addEventListener('pointerdown', this.headerClickEvent.bind(this));
  }

  headerClickEvent(event) {
    const headerCell = event.target.closest('.sortable-table__cell');

    //check element
    if (!headerCell || !this.subElements.header.contains(headerCell)) {
      return;
    }

    //check that field is sortable
    if (headerCell.dataset.sortable !== 'true') {
      return;
    }

    //get field and order
    const field = headerCell.dataset.id;
    const currentFieldSorting = headerCell.dataset.order;
    const order = (!currentFieldSorting || (currentFieldSorting === 'asc')) ? 'desc' : 'asc';

    this.sort(field, order);
  }

  sort(field = '', order = '') {
    if (this.getSortedField().fieldName === field && this.getSortedField().order === order) {
      return;
    }

    this.sortData(field, order);

    this.updateTableHeaderWithSort();
    
    this.subElements.body.innerHTML = SortableTable.getBodyRowsTemplate(this.headers, this.data);
  }

  sortData(field = '', order = '') {
    const sortDirections = {asc: 1, desc: -1};
    if (!Object.hasOwn(sortDirections, order)) {
      throw new Error(`Unknown parameter 'param': '${order}' !`);
    }
    if (!this.headersMap.has(field)) {
      throw new Error(`There is no field = ${field}`);
    }
    if (!this.headersMap.get(field).sortable) {
      throw new Error(`This field ('${field}) is not sortable`);
    }

    const sortType = this.headersMap.get(field).sortType;
    this.data.sort((item1, item2) => {
      return sortDirections[order] * this.getCompare(sortType)(item1[field], item2[field]);
    });
    this.setSortedField(field, order);
  }

  updateTableHeaderWithSort() {
    if (!this.getSortedField()) {
      return;
    }

    this.subElements.header.querySelectorAll(`[data-order]`).forEach(fieldElement => fieldElement.removeAttribute('data-order'));
    this.subElements.header.querySelectorAll('.sortable-table__sort-arrow').forEach(arrow => arrow.remove());

    const sortedHeaderField = this.subElements.header.querySelector(`[data-id="${this.getSortedField().fieldName}"]`);
    sortedHeaderField.dataset.order = this.getSortedField().order;
    sortedHeaderField.insertAdjacentHTML('beforeend', SortableTable.getHeaderArrowTemplate());
  }

  getSubTableElements(tableElement) {
    return Object.fromEntries(
      [...tableElement.querySelectorAll('[data-element]')]
        .map(dataElement => [dataElement.dataset.element, dataElement])
    );
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
}
