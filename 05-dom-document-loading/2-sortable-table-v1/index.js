export default class SortableTable {

  _sortedField = {
    fieldName: '',
    order: '',
  }

  constructor(headerConfig = [], data = []) {
    this._headers = headerConfig.map((header) => new Header(header));
    this._headersMap = new Map(this._headers.map(header => [header.id, header]));
    this._headerIds = [...this._headersMap.keys()];
    
    this._data = data.map((item) => 
      Object.fromEntries(['id', ...this._headerIds].map(props => [props, item[props]]))
    );

    this.render();
  }

  render() {
    const tableWrapper = document.createElement('div');
    tableWrapper.innerHTML = SortableTable.getTableTemplate(this.getHeaders(), this.getData());

    this.element = tableWrapper.firstElementChild;

    this.subElements = this.findSubElements();
  }
 
  sort(field = '', order = 'asc') {
    if (this.getSortedField().fieldName === field && this.getSortedField().order === order) {
      return;
    }

    //verify arguments
    const sortDirections = {asc: 1, desc: -1};
    if (!Object.hasOwn(sortDirections, order)) {
      throw new Error(`Unknown parameter 'param': '${order}' !`);
    }
    if (!this.getHeadersMap().has(field)) {
      throw new Error(`There is no field = ${field}`);
    }
    if (!this.getHeadersMap().get(field).sortable) {
      throw new Error(`This field ('${field}) is not sortable`);
    }

    //sort data
    const compare = {
      string: (s1, s2) => String(s1).localeCompare(String(s2), ['ru', 'en'], {caseFirst: 'upper'}),
      number: (n1, n2) => Number(n1) - Number(n2),
    };
    const sortType = this.getHeadersMap().get(field).sortType;
    this._data = this._data.sort((item1, item2) => {
      return sortDirections[order] * compare[sortType](item1[field], item2[field]);
    });
    this.setSortedField(field, order);

    //update table
    this.subElements.header.querySelectorAll(`[data-order]`).forEach(fieldElement => fieldElement.removeAttribute('data-order'));
    this.subElements.header.querySelector(`[data-id="${this.getSortedField().fieldName}"]`).dataset.order = order;
    this.subElements.body.innerHTML = SortableTable.getRowsTemplate(this.getHeaders(), this.getData());
  }

  findSubElements() {
    const subElements = [...this.element.querySelectorAll('[data-element]')];
    return Object.fromEntries(subElements.map(subElement => [subElement.dataset.element, subElement]));
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
  }

  // Get/Set
  getSortedField() {
    return this._sortedField;
  }
  setSortedField(field = '', order = '') {
    this._sortedField.fieldName = field;
    this._sortedField.order = order;
  }
  getHeadersMap() {
    return this._headersMap;
  }
  getHeaders() {
    return this._headers;
  }
  getHeaderIds() {
    return this._headerIds;
  }
  getData() {
    return this._data;
  }

  //static
  static getTableTemplate(headers = [], data = []) {
    return `
      <div class="sortable-table">
        ${SortableTable.getHeadersTemplate(headers)}
        ${SortableTable.getBodyTemplate(headers, data)}
      </div>
    `;
  }

  static getHeadersTemplate(headers = []) {
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${SortableTable.getHeaderCellsTemplate(headers)}
      </div>
    `;
  }
  static getHeaderCellsTemplate(headers = []) {
    return headers.map(header => SortableTable.getHeaderCellTemplate(header)).join('');
  }
  static getHeaderCellTemplate({id = '', title = '', sortable = false} = {}) {
    return `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
        <span>${title}</span>
      </div>
    `;
  }

  static getBodyTemplate(headers = [], data = []) {
    return `
      <div data-element="body" class="sortable-table__body">
        ${SortableTable.getRowsTemplate(headers, data)}
      </div>
    `;
  }
  static getRowsTemplate(headers = [], data = []) {
    return data.map(data => SortableTable.getRowTemplate(headers, data)).join('');
  }
  static getRowTemplate(headers = [], data = {}) {
    return `
      <a href="/products/${data.id}" class="sortable-table__row">
        ${headers.map(header => header.template(data[header.id])).join('')}
      </a>
    `;
  }
  static getBodyCellTemplate(value = '') {
    return `<div class="sortable-table__cell">${value}</div>`;
  }

}


class Header {
  constructor({id = '', title = '', sortable = false, sortType = 'string', template = SortableTable.getBodyCellTemplate} = {}) {
    this.id = id;
    this.title = title;
    this.sortable = sortable;
    this.sortType = sortType;
    this.template = template;
  }
}