export default class NotificationMessage {

    static currentNotification;
    static destroyCurrentNotification() {
        if(NotificationMessage.currentNotification) {
            NotificationMessage.currentNotification.destroy();
        }
    }
    

    constructor(message = '', {duration = 0, type = ''} = {}) {
        this._message = message;
        this._duration = duration;
        this._type = type;
        
        this.render();
    }

    get duration() {
        return this._duration;
    }

    getType() {
        return this._type;
    }
    getMessage() {
        return this._message;
    }

    show(parentElement = document.body) {
        NotificationMessage.destroyCurrentNotification();

        parentElement.append(this.element);
        NotificationMessage.currentNotification = this;
        setTimeout(() => {
            this.destroy();
        }, this.duration);
    }

    render() {
        const elementWrapper = document.createElement('div');
        elementWrapper.innerHTML = this.getTemplate();
        
        this.element = elementWrapper.firstElementChild;
    }

    getTemplate() {
        return `
  <div class="notification ${this.getType()}" style="--value:${this.duration/1000}s">
    <div class="timer"></div>
    <div class="inner-wrapper">
      <div class="notification-header">${this.getType()}</div>
      <div class="notification-body">
      ${this.getMessage()}
      </div>
    </div>
  </div>
        `;
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

}
