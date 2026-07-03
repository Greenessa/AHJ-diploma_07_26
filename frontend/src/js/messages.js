export default class Messages {
    constructor() {
      this.messagesEl = document.querySelector('.messages');
    }
  
    renderMessages(messages) {
      messages.forEach((message) => {
        this.renderMessage(message);
      });
  
      this.scrollToBottom();
    }
  
    prependMessages(messages) {
        const firstMessage = this.messagesEl.querySelector('.message');
    
        messages.forEach((message) => {
            const messageEl = this.createMessageElement(message);
    
            if (firstMessage) {
                this.messagesEl.insertBefore(messageEl, firstMessage);
            } else {
                this.messagesEl.append(messageEl);
            }
        });
    }
  
    renderMessage(message) {
      const messageEl = this.createMessageElement(message);
      this.messagesEl.append(messageEl);
    }
  
    createMessageElement(message) {
      const messageEl = document.createElement('article');
      messageEl.classList.add('message');
  
      if (message.author === 'bot') {
        messageEl.classList.add('message--bot');
      } else {
        messageEl.classList.add('message--user');
      }
  
      const contentEl = this.createContent(message);
  
      const timeEl = document.createElement('div');
      timeEl.classList.add('message__time');
      timeEl.textContent = message.time;
  
      messageEl.append(contentEl);
      messageEl.append(timeEl);
      const favoriteButton = document.createElement('button');
      favoriteButton.classList.add('message__favorite');
      favoriteButton.textContent = message.favorite ? '⭐' : '☆';
      favoriteButton.type = 'button';
      favoriteButton.dataset.id = message.id;
      messageEl.append(favoriteButton);
  
      return messageEl;
    }
  
    createContent(message) {
      switch (message.type) {
        case 'text':
          return this.createText(message);
  
        case 'image':
          return this.createImage(message);
  
        case 'audio':
          return this.createAudio(message);
  
        case 'video':
          return this.createVideo(message);
  
        default:
          return this.createFile(message);
      }
    }
  
    createText(message) {
      const textEl = document.createElement('div');
      textEl.classList.add('message__text');
  
      const regexp = /(https?:\/\/[^\s]+)/g;
  
      const parts = message.text.split(regexp);
  
      parts.forEach((part) => {
        if (part.match(regexp)) {
          const link = document.createElement('a');
  
          link.href = part;
          link.textContent = part;
          link.target = '_blank';
  
          textEl.append(link);
        } else {
          textEl.append(document.createTextNode(part));
        }
      });
  
      return textEl;
    }
  
    createImage(message) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('message__media');
  
      const image = document.createElement('img');
      image.classList.add('message__image');
      image.src = message.fileUrl;
      image.alt = message.fileName;
  
      wrapper.append(image);
      wrapper.append(this.createDownloadLink(message));
  
      return wrapper;
    }
  
    createAudio(message) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('message__media');
  
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = message.fileUrl;
  
      wrapper.append(audio);
      wrapper.append(this.createDownloadLink(message));
  
      return wrapper;
    }
  
    createVideo(message) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('message__media');
  
      const video = document.createElement('video');
      video.classList.add('message__video');
      video.controls = true;
      video.src = message.fileUrl;
  
      wrapper.append(video);
      wrapper.append(this.createDownloadLink(message));
  
      return wrapper;
    }
  
    createFile(message) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('message__file');
  
      const icon = document.createElement('div');
      icon.classList.add('message__file-icon');
      icon.textContent = '📎';
  
      const info = document.createElement('div');
  
      const name = document.createElement('p');
      name.classList.add('message__file-name');
      name.textContent = message.fileName;
  
      info.append(name);
      info.append(this.createDownloadLink(message));
  
      wrapper.append(icon);
      wrapper.append(info);
  
      return wrapper;
    }
  
    createDownloadLink(message) {
      const link = document.createElement('a');
  
      link.classList.add('message__file-download');
      link.href = message.fileUrl;
      link.download = message.fileName;
      link.textContent = 'Скачать файл';
  
      return link;
    }
  
    scrollToBottom() {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    clearMessages() {
        const messageEls = this.messagesEl.querySelectorAll('.message');
      
        messageEls.forEach((messageEl) => {
          messageEl.remove();
        });
      }
  }