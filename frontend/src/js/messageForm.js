import Messages from './messages';

export default class MessageForm {
  constructor() {
    this.BASE_URL = 'http://localhost:7070';

    this.messagesState = new Messages();

    this.formEl = document.querySelector('.message-form');
    this.emojiPanelEl = document.querySelector('.emoji-panel');
    this.fileInputEl = document.querySelector('.message-form__file-input');
    this.messageInputEl = document.querySelector('.message-form__input');
    this.messageSendEl = document.querySelector('.message-form__send');
    this.messagesEl = document.querySelector('.messages');
    this.buttonLoadMore = document.querySelector('.messages__load-more');
    this.buttonEmoji = document.querySelector('.emoji-button');
    this.favoriteEl = document.querySelector('.favorite');
    this.imageEl = document.querySelector('.image');
    this.videoEl = document.querySelector('.video');
    this.audioEl = document.querySelector('.audio');
    this.fileEl = document.querySelector('.file');
    this.pinnedEl = document.querySelector('.pinned-message');
    this.chatEl = document.querySelector('.chat-button');
    this.geolocationSendEl = document.querySelector('.geolocation__send');
    this.pinnedId;
    this.limit = 3;
    this.offset = 0;
    this.hasMore = true;

    this.registerEvents();
  }

  registerEvents() {

    this.geolocationSendEl.addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            console.log(pos.coords);
            // console.log(new Date(pos.timestamp).toLocaleString());
            const position = ` Моя текущая позиция: lat: ${pos.coords.latitude} long: ${pos.coords.longitude}`;
            const result = await this.createTextMessage(position);
            this.messagesState.renderMessages(result.messages);
            this.offset += result.messages.length;
            this.updateLoadMoreButton();
        })
    
    });

    this.buttonEmoji.addEventListener('click', () => {
        this.emojiPanelEl.classList.toggle('hidden');
    });

    this.emojiPanelEl.addEventListener('click', (event) => {
        if (!event.target.classList.contains('emoji')) {
            return;
        }
        this.emojiPanelEl.classList.add('hidden');
        const textEmoji = event.target.textContent;
        this.messageInputEl.value += textEmoji;
        
    })

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

      this.imageEl.addEventListener('click', async () => {
        const result = await this.getImageMessages();
        // console.log(result.messages);
        this.messagesState.clearMessages();
        this.buttonLoadMore.style.display = 'none'
        this.messagesState.renderMessages(result.messages);
      });

      this.videoEl.addEventListener('click', async () => {
        const result = await this.getVideoMessages();
        // console.log(result.messages);
        this.messagesState.clearMessages();
        this.buttonLoadMore.style.display = 'none'
        this.messagesState.renderMessages(result.messages);
      });

      this.audioEl.addEventListener('click', async () => {
        const result = await this.getAudioMessages();
        // console.log(result.messages);
        this.messagesState.clearMessages();
        this.buttonLoadMore.style.display = 'none'
        this.messagesState.renderMessages(result.messages);
      });

      this.fileEl.addEventListener('click', async () => {
        const result = await this.getFileMessages();
        // console.log(result.messages);
        this.messagesState.clearMessages();
        this.buttonLoadMore.style.display = 'none'
        this.messagesState.renderMessages(result.messages);
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

    this.messagesEl.addEventListener('click', async (event) => {
        if (!event.target.classList.contains('message__pin')) {
          return;
        }
      
        const id = event.target.dataset.id;
        const toggleButtonEl = event.target;
      
        const updatedMessage = await this.togglePinned(id);
      
        document.querySelectorAll('.message__pin').forEach((button) => {
          button.textContent = '📌❌';
        });
      
        if (updatedMessage.pinned) {
          this.pinnedId = id;
          this.renderPinnedMessage(updatedMessage);
      
          toggleButtonEl.textContent = '📌';
        } else {
          this.pinnedId = null;
          this.removePinnedMessage();
      
          toggleButtonEl.textContent = '📌❌';
        }
      });

  }

  async loadApp() {
    const result = await this.getMessages();

    this.messagesState.renderMessages(result.messages);
    this.offset += result.messages.length;
    this.hasMore = result.hasMore;

    this.updateLoadMoreButton();
    const pinned = result.messages.find((message) => {
        return message.pinned
    })
    if (pinned) {
        this.renderPinnedMessage(pinned);
    }
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

   async getPinnedMessage() {
    const response = await fetch(`${this.BASE_URL}/pinned`);
    if (!response.ok) {
        throw new Error('Не удалось загрузить закреплённое сообщение');
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

  async getImageMessages() {
    const response = await fetch(`${this.BASE_URL}/image`);

    if (!response.ok) {
      throw new Error('Не удалось загрузить сообщения');
    }

    return response.json();
  }

  
  async getVideoMessages() {
    const response = await fetch(`${this.BASE_URL}/video`);

    if (!response.ok) {
      throw new Error('Не удалось загрузить сообщения');
    }

    return response.json();
  }

  async getAudioMessages() {
    const response = await fetch(`${this.BASE_URL}/audio`);

    if (!response.ok) {
      throw new Error('Не удалось загрузить сообщения');
    }

    return response.json();
  }

  async getFileMessages() {
    const response = await fetch(`${this.BASE_URL}/file`);

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

  async togglePinned(id) {
    const response = await fetch(
        `${this.BASE_URL}/messages/${id}/pinned`,
        {
          method: 'PATCH',
        }
      );
    
      if (!response.ok) {
        throw new Error('Не удалось изменить закрепление');
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

  renderPinnedMessage(message) {
    const pinnedText = document.querySelector(".pinned-message__text");
    const contentEl = this.messagesState.createContent(message);
    
    if (message.text) {
        pinnedText.textContent = message.text; 
    } else {
        pinnedText.textContent = message.type;
        contentEl.classList.add('exist');
        this.pinnedEl.append(contentEl);
    }
    
    }

    removePinnedMessage() {
        const pinnedText = document.querySelector(".pinned-message__text");
        pinnedText.textContent = 'Здесь будет закреплённое сообщение';
        const contentEl = document.querySelector('.exist');
        if (contentEl) {
            contentEl.remove();
        }
        
    }
}