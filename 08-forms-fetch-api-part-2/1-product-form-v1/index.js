import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {

  _categoriesEndpoint = 'api/rest/categories?_sort=weight&_refs=subcategory';
  _productPath = 'api/rest/products';

  getCategoriesURL = () => {
    return new URL(this._categoriesEndpoint, BACKEND_URL);
  }

  getProductURL = (productId = this.productId) => {
    const url = new URL(this._productPath, BACKEND_URL);
    url.searchParams.append('id', productId);
    return url;
  }

  save = () => {
    const saveClickEvent = new Event(this.isUpdateMode() ? 'product-updated' : 'product-saved');
    this.element.dispatchEvent(saveClickEvent);
  }

  deleteImage = (event) => {
    const li = event.target.closest('li.products-edit__imagelist-item');
    if (!Object.hasOwn(event.target.dataset, 'deleteHandle') || !li) {
      return;
    }

    li.remove();
  }

  constructor (productId) {
    this.productId = productId;
  }

  isUpdateMode() {
    return Boolean(this.productId);
  }

  async render () {
    const requests = [];
    requests.push(fetchJson(this.getCategoriesURL()));
    if (this.isUpdateMode()) {
      requests.push(fetchJson(this.getProductURL()));
    }

    let responses;
    try {
      responses = await Promise.all(requests);
    } catch(error) {
      console.error(error);
      return;
    }

    const categoryValues = this.getCategoriesForForm(responses[0]);

    const formWrapper = document.createElement('div');
    formWrapper.innerHTML = this.getFormTemplate(categoryValues);

    this.element = formWrapper.firstElementChild;

    this.subElements = this.getSubElements();

    if (this.isUpdateMode()) {
      this.updateFormWithProductInfo(responses[1][0]);
    }

    this.subElements.productForm.elements.save.addEventListener('pointerdown', this.save);

    return this.element;
  }

  getSubElements(element = this.element) {
    return Object.fromEntries([...element.querySelectorAll('[data-element]')].map(subElement => [subElement.dataset.element, subElement]));
  }

  getCategoriesForForm(categoriesResponseJson = []) {
    return categoriesResponseJson.reduce((result, category) => {
      result.push(...this.getCategoryValues(category));
      return result;
    }, []);
  }

  getCategoryValues(category = {}) {
    const resultTitles = [];
    if (!Object.hasOwn(category, 'subcategories')) {
      resultTitles.push(category.title);
      return resultTitles;
    }

    category.subcategories.forEach(subCategory => {
      this.getCategoryValues(subCategory).forEach(subCtegoryValue => {
        resultTitles.push(`${category.title} &gt; ${subCtegoryValue}`);
      });
    });

    return resultTitles;
  }

  updateFormWithProductInfo(product) {
    const form = this.subElements.productForm;
    [
      "title",
      "description",
      "price",
      "discount",
      "quantity",
      "status"
    ].forEach(field => {
      form.elements[field].value = product[field];
    });

    this.subElements.imageListContainer.innerHTML = this.getImagesListTemplate(product.images);
    this.subElements.imageListContainer.addEventListener('pointerdown', this.deleteImage);
  }

  getFormTemplate(categoryValues, productInfo = {}) {
    return `
  <div class="product-form">
    <form data-element="productForm" class="form-grid">
      <div class="form-group form-group__half_left">
        <fieldset>
          <label class="form-label">Название товара</label>
          <input id="title" required="" type="text" name="title" class="form-control" placeholder="Название товара">
        </fieldset>
      </div>
      <div class="form-group form-group__wide">
        <label class="form-label">Описание</label>
        <textarea id="description" required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
      </div>
      <div class="form-group form-group__wide" data-element="sortable-list-container">
        <label class="form-label">Фото</label>
          <div data-element="imageListContainer">
            ${this.getImagesListTemplate(productInfo.images)}
          </div>
        <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
      </div>
      ${this.getCategoriesTemplate(categoryValues)}
      <div class="form-group form-group__half_left form-group__two-col">
        <fieldset>
          <label class="form-label">Цена ($)</label>
          <input id="price" required="" type="number" name="price" class="form-control" placeholder="100">
        </fieldset>
        <fieldset>
          <label class="form-label">Скидка ($)</label>
          <input id="discount" required="" type="number" name="discount" class="form-control" placeholder="0">
        </fieldset>
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Количество</label>
        <input id="quantity" required="" type="number" class="form-control" name="quantity" placeholder="1">
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Статус</label>
        <select id="status" class="form-control" name="status">
          <option value="1">Активен</option>
          <option value="0">Неактивен</option>
        </select>
      </div>
      <div class="form-buttons">
        <button type="submit" name="save" class="button-primary-outline">
          Сохранить товар
        </button>
      </div>
    </form>
  </div>
    `;
  }

  getImagesListTemplate(images = []) {
    if (!images.length) return '';
    return `
          <ul class="sortable-list">
            ${images.map(image => this.getImageTemplate(image)).join('')}
          </ul>
    `
  }
  getImageTemplate(image) {
    return `
            <li class="products-edit__imagelist-item sortable-list__item" style="">
              <input type="hidden" name="url" value="${image.url}">
              <input type="hidden" name="source" value="${image.source}">
              <span>
                <img src="icon-grab.svg" data-grab-handle="" alt="grab">
                <img class="sortable-table__cell-img" alt="Image" src="${image.url}">
                <span>${image.source}</span>
              </span>
              <button type="button">
                <img src="icon-trash.svg" data-delete-handle="" alt="delete">
              </button>
            </li>
    `;
  }

  getCategoriesTemplate(categoryValues = []) {
    if (!categoryValues.length) return '';
    return `
      <div class="form-group form-group__half_left">
        <label class="form-label">Категория</label>
        <select id="subcategory" class="form-control" name="subcategory">
        ${categoryValues.map(value => this.getCategoryOptionTemplate(value)).join('')}
        </select>
      </div>
    `;
  }
  getCategoryOptionTemplate(category = '') {
    return `
    <option value="ochki-virtualnoy-realnosti">${category}</option>
    `
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
