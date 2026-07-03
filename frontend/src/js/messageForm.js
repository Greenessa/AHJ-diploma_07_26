import Messages from './messages';

export default class MessageForm {
  constructor() {
    this.BASE_URL = 'http://localhost:7070';

    this.messagesState = new Messages();

    this.formEl = document.querySelector('.message-form');
    this.fileInputEl = document.querySelector('.message-form__file-input');
    this.messageInputEl = document.querySelector('.message-form__input');
    this.messageSendEl = document.querySelector('.message-form__send');
    this.messagesEl = document.querySelector('.messages');
    this.buttonLoadMore = document.querySelector('.messages__load-more');
    this.favoriteEl = document.querySelector('.favorite');
    this.chatEl = document.querySelector('.chat-button');

    this.limit = 3;
    this.offset = 0;
    this.hasMore = true;

    this.registerEvents();
  }

  registerEvents() {

    this.chatEl.addEventListener('click', async () => {
        this.offset = 0;
        this.hasMore = true;
      
        const result = await this.getMessages();
      
        this.messagesState.clearMessages();
        this.messagesState.renderMessages(result.messages);
      
        this.offset = result.messages.length;
        this.hasMore = result.hasMore;
      
        this.updateLoadMoreButton();
      });

    this.favoriteEl.addEventListener('click', async () => {
        const result = await this.getFavoriteMessages();
        // console.log(result.messages);
        this.messagesState.clearMessages();
        this.buttonLoadMore.style.display = 'none'
        this.messagesState.renderMessages(result.messages);
      });

    this.formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      this.addTextMessage();
    });

    this.messageInputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.addTextMessage();
      }
    });

    this.fileInputEl.addEventListener('change', (event) => {
      const files = Array.from(event.target.files);
      this.addFiles(files);
      event.target.value = '';
    });

    this.buttonLoadMore.addEventListener('click', () => {
      this.loadOldMessages();
    });

    this.messagesEl.addEventListener('dragover', (event) => {
      event.preventDefault();
      this.messagesEl.classList.add('messages--dragover');
    });

    this.messagesEl.addEventListener('dragleave', () => {
      this.messagesEl.classList.remove('messages--dragover');
    });

    this.messagesEl.addEventListener('drop', (event) => {
      event.preventDefault();
      this.messagesEl.classList.remove('messages--dragover');

      const files = Array.from(event.dataTransfer.files);
      this.addFiles(files);
    });

    this.messagesEl.addEventListener('click', async (event) => {
        if (!event.target.classList.contains('message__favorite')) {
            return;
        }
    
        const id = event.target.dataset.id;
        const toggleButtonEl = event.target;
    
        const updatedMessage = await this.toggleFavorite(id);
    
        toggleButtonEl.textContent = updatedMessage.favorite ? '⭐' : '☆';
    });
  }

  async loadApp() {
    const result = await this.getMessages();

    this.messagesState.renderMessages(result.messages);
    this.offset += result.messages.length;
    this.hasMore = result.hasMore;

    this.updateLoadMoreButton();
  }

  async loadOldMessages() {
    if (!this.hasMore) {
      return;
    }

    const result = await this.getMessages();

    this.messagesState.prependMessages(result.messages);
    this.offset += result.messages.length;
    this.hasMore = result.hasMore;

    this.updateLoadMoreButton();
  }

  async addTextMessage() {
    console.log('addTextMessage вызвался');
  
    const text = this.messageInputEl.value.trim();
  
    if (!text) {
      console.log('текст пустой');
      return;
    }
  
    console.log('отправляем текст на сервер:', text);
  
    const result = await this.createTextMessage(text);
  
    console.log('ответ сервера:', result);
  
    this.messagesState.renderMessages(result.messages);
    this.offset += result.messages.length;
  
    this.updateLoadMoreButton();
  
    this.messageInputEl.value = '';
  }

  async addFiles(files) {
    console.log('addFiles вызвался', files);
  
    if (!files.length) {
      console.log('файлов нет');
      return;
    }
  
    for (const file of files) {
      console.log('отправляем файл на сервер:', file.name);
  
      const result = await this.uploadFile(file);
  
      console.log('ответ сервера по файлу:', result);
  
      this.messagesState.renderMessages(result.messages);
      this.offset += result.messages.length;
  
      this.updateLoadMoreButton();
    }
  }

  async getMessages() {
    const response = await fetch(`${this.BASE_URL}/messages?offset=${this.offset}&limit=${this.limit}`);

    if (!response.ok) {
      throw new Error('Не удалось загрузить сообщения');
    }

    return response.json();
  }

  async getFavoriteMessages() {
    const response = await fetch(`${this.BASE_URL}/favorite`);

    if (!response.ok) {
      throw new Error('Не удалось загрузить сообщения');
    }

    return response.json();
  }



  async createTextMessage(text) {
    const response = await fetch(`${this.BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Не удалось создать сообщение');
    }

    return response.json();
  }

  async toggleFavorite(id) {
    const response = await fetch(
      `${this.BASE_URL}/messages/${id}/favorite`,
      {
        method: 'PATCH',
      }
    );
  
    if (!response.ok) {
      throw new Error('Не удалось изменить избранное');
    }
  
    return response.json();
  }

  async uploadFile(file) {
    const formData = new FormData();

    formData.append('file', file);

    const response = await fetch(`${this.BASE_URL}/files`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Не удалось загрузить файл');
    }

    return response.json();
  }

  updateLoadMoreButton() {
    if (this.hasMore) {
      this.buttonLoadMore.style.display = 'block';
    } else {
      this.buttonLoadMore.style.display = 'none';
    }
  }
}