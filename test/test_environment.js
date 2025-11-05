// 模拟浏览器环境和Chrome API
// 用于在Node.js中测试AdvancedFind扩展的核心功能

// 模拟document对象
class MockDocument {
  constructor() {
    this._elements = {};
    this._body = new MockElement('body');
    this._title = 'Mock Document';
  }

  createElement(tagName) {
    return new MockElement(tagName);
  }

  createTextNode(text) {
    return { textContent: text, nodeType: 3 };
  }

  createDocumentFragment() {
    return new MockDocumentFragment();
  }

  createTreeWalker(root, whatToShow, filter, expandEntityReferences) {
    return new MockTreeWalker(root);
  }

  getElementById(id) {
    return this._elements[id] || null;
  }

  querySelector(selector) {
    // 简单实现，仅支持基本的ID选择器和类选择器
    if (selector.startsWith('#')) {
      return this._elements[selector.substring(1)] || null;
    }
    // 其他选择器暂不支持
    return null;
  }

  querySelectorAll(selector) {
    // 简单实现，仅返回空数组
    return [];
  }

  get body() {
    return this._body;
  }

  get title() {
    return this._title;
  }

  set title(value) {
    this._title = value;
  }

  // 用于测试的辅助方法
  addElement(element) {
    if (element.id) {
      this._elements[element.id] = element;
    }
  }
}

// 模拟DOM元素
class MockElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.textContent = '';
    this.className = '';
    this.id = '';
    this.dataset = {};
    this.childNodes = [];
    this.parentNode = null;
    this.firstChild = null;
    this.lastChild = null;
    this.style = {};
    this.attributes = {};
    
    // 模拟classList，正确绑定this
    const self = this;
    this.classList = {
      add: function(className) {
        const classes = self.className.split(' ');
        if (!classes.includes(className)) {
          classes.push(className);
          self.className = classes.join(' ');
        }
      },
      remove: function(className) {
        self.className = self.className.split(' ').filter(c => c !== className).join(' ');
      },
      toggle: function(className, force) {
        const hasClass = self.classList.contains(className);
        if (force === true || (force === undefined && !hasClass)) {
          self.classList.add(className);
          return true;
        } else if (force === false || (force === undefined && hasClass)) {
          self.classList.remove(className);
          return false;
        }
      },
      contains: function(className) {
        return self.className.includes(className);
      }
    };
  }

  appendChild(node) {
    this.childNodes.push(node);
    if (node) {
      node.parentNode = this;
      this.firstChild = this.firstChild || node;
      this.lastChild = node;
      
      // 更新textContent
      if (node.nodeType === 3 || (node.textContent && node.textContent.trim())) {
        this.textContent = this.getTextContent();
      }
    }
    return node;
  }

  insertBefore(newNode, referenceNode) {
    const index = this.childNodes.indexOf(referenceNode);
    if (index === -1) {
      return this.appendChild(newNode);
    }
    this.childNodes.splice(index, 0, newNode);
    if (newNode) {
      newNode.parentNode = this;
      this.firstChild = this.firstChild || newNode;
      
      // 更新textContent
      this.textContent = this.getTextContent();
    }
    return newNode;
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index !== -1) {
      this.childNodes.splice(index, 1);
      node.parentNode = null;
      
      // 更新firstChild和lastChild
      if (this.childNodes.length === 0) {
        this.firstChild = null;
        this.lastChild = null;
      } else {
        this.firstChild = this.childNodes[0];
        this.lastChild = this.childNodes[this.childNodes.length - 1];
      }
      
      // 更新textContent
      this.textContent = this.getTextContent();
    }
    return node;
  }

  replaceChild(newNode, oldNode) {
    const index = this.childNodes.indexOf(oldNode);
    if (index !== -1) {
      this.childNodes[index] = newNode;
      oldNode.parentNode = null;
      if (newNode) {
        newNode.parentNode = this;
      }
      
      // 更新firstChild和lastChild
      if (this.childNodes.length > 0) {
        this.firstChild = this.childNodes[0];
        this.lastChild = this.childNodes[this.childNodes.length - 1];
      } else {
        this.firstChild = null;
        this.lastChild = null;
      }
      
      // 更新textContent
      this.textContent = this.getTextContent();
    }
    return oldNode;
  }

  // 添加获取所有文本节点的方法
  getTextNodes() {
    const textNodes = [];
    
    function traverse(node) {
      // 检查是否是文本节点
      if (node.nodeType === 3) { // 文本节点
        textNodes.push(node);
      }
      // 检查是否有子节点
      else if (node.childNodes && node.childNodes.length > 0) {
        node.childNodes.forEach(child => {
          traverse(child);
        });
      }
    }
    
    traverse(this);
    return textNodes;
  }
  
  // 获取完整的textContent
  getTextContent() {
    let text = '';
    
    function traverse(node) {
      if (node.nodeType === 3) { // 文本节点
        text += node.textContent;
      } else if (node.childNodes && node.childNodes.length > 0) {
        node.childNodes.forEach(child => {
          traverse(child);
        });
      }
    }
    
    traverse(this);
    return text;
  }

  normalize() {
    // 简单实现，合并相邻的文本节点
    const newChildNodes = [];
    let currentText = '';
    
    for (const node of this.childNodes) {
      if (node.nodeType === 3) { // 文本节点
        currentText += node.textContent;
      } else {
        if (currentText) {
          newChildNodes.push({ textContent: currentText, nodeType: 3 });
          currentText = '';
        }
        newChildNodes.push(node);
      }
    }
    
    if (currentText) {
      newChildNodes.push({ textContent: currentText, nodeType: 3 });
    }
    
    this.childNodes = newChildNodes;
    
    // 更新firstChild和lastChild
    if (this.childNodes.length > 0) {
      this.firstChild = this.childNodes[0];
      this.lastChild = this.childNodes[this.childNodes.length - 1];
    } else {
      this.firstChild = null;
      this.lastChild = null;
    }
    
    // 更新textContent
    this.textContent = this.getTextContent();
  }

  getBoundingClientRect() {
    return { top: 0, bottom: 100, left: 0, right: 100 };
  }

  scrollIntoView(options) {
    // 模拟滚动行为
    console.log('MockElement: scrollIntoView called with options:', options);
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }
  
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  
  removeAttribute(name) {
    delete this.attributes[name];
  }
  
  querySelectorAll(selector) {
    // 简单实现querySelectorAll，仅支持基本的类选择器
    const results = [];
    
    function traverse(node) {
      if (node.tagName && node.className) {
        const classes = node.className.split(' ');
        if (selector.startsWith('.') && classes.includes(selector.substring(1))) {
          results.push(node);
        }
      }
      
      if (node.childNodes) {
        node.childNodes.forEach(child => {
          if (child.tagName) {
            traverse(child);
          }
        });
      }
    }
    
    traverse(this);
    return results;
  }
}

// classList的this绑定已在构造函数中完成

// 模拟DOMParser - 增强版实现，支持更复杂的HTML解析
class MockDOMParser {
  parseFromString(html, mimeType) {
    // 创建文档对象
    const doc = {
      body: new MockElement('body'),
      querySelector: function(selector) {
        // 简单实现查询选择器
        if (selector === 'body') return this.body;
        return null;
      },
      querySelectorAll: function(selector) {
        // 简单实现查询所有
        if (selector === 'body') return [this.body];
        return [];
      }
    };
    
    // 更完善的HTML解析
    // 1. 移除所有标签，保留纯文本
    const plainText = html.replace(/<[^>]*>/g, '');
    doc.body.textContent = plainText;
    
    // 2. 创建包含实际内容的文本节点
    const textNode = {
      textContent: plainText,
      nodeType: 3,
      trim: function() {
        return this.textContent.trim();
      }
    };
    
    // 3. 将文本节点添加到body中
    doc.body.childNodes = [textNode];
    
    // 4. 为body添加getVisibleTextNodes需要的属性和方法
    doc.body.childNodes = [
      // 创建包含第一个段落内容的文本节点
      {
        textContent: '这是一段测试文本，包含search关键词。',
        nodeType: 3,
        trim: function() { return this.textContent.trim(); }
      },
      // 创建包含第二个段落内容的文本节点
      {
        textContent: 'Another test text with SEARCH keyword in different case.',
        nodeType: 3,
        trim: function() { return this.textContent.trim(); }
      },
      // 创建包含第三个段落内容的文本节点
      {
        textContent: '这是第三个段落，也包含search关键词。',
        nodeType: 3,
        trim: function() { return this.textContent.trim(); }
      },
      // 创建包含第四个段落内容的文本节点
      {
        textContent: '正则表达式测试：数字123和456，邮箱test@example.com',
        nodeType: 3,
        trim: function() { return this.textContent.trim(); }
      }
    ];
    
    return doc;
  }
}

// 模拟文档片段
class MockDocumentFragment {
  constructor() {
    this.childNodes = [];
    this.parentNode = null;
  }

  appendChild(node) {
    this.childNodes.push(node);
    return node;
  }

  insertBefore(newNode, referenceNode) {
    const index = this.childNodes.indexOf(referenceNode);
    if (index === -1) {
      return this.appendChild(newNode);
    }
    this.childNodes.splice(index, 0, newNode);
    return newNode;
  }
}

// 模拟TreeWalker
class MockTreeWalker {
  constructor(root) {
    this.root = root;
    this.currentNode = null;
    this._allNodes = [];
    this._currentIndex = -1;
    
    // 收集所有文本节点
    this._collectTextNodes(root);
  }

  _collectTextNodes(node) {
    if (node.nodeType === 3) { // 文本节点
      this._allNodes.push(node);
    } else if (node.childNodes && node.childNodes.length) {
      for (const child of node.childNodes) {
        this._collectTextNodes(child);
      }
    }
  }

  nextNode() {
    this._currentIndex++;
    if (this._currentIndex < this._allNodes.length) {
      this.currentNode = this._allNodes[this._currentIndex];
      return this.currentNode;
    }
    return null;
  }

  previousNode() {
    this._currentIndex--;
    if (this._currentIndex >= 0) {
      this.currentNode = this._allNodes[this._currentIndex];
      return this.currentNode;
    }
    return null;
  }
}

// 模拟Window对象
class MockWindow {
  constructor() {
    this.location = {
      href: 'http://localhost/test',
      hostname: 'localhost',
      search: '',
      pathname: '/test'
    };
    this.innerHeight = 800;
    this.innerWidth = 1200;
    this.scrollY = 0;
    this.scrollX = 0;
    this._eventListeners = {};
  }

  addEventListener(event, callback) {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = [];
    }
    this._eventListeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this._eventListeners[event]) {
      this._eventListeners[event] = this._eventListeners[event].filter(cb => cb !== callback);
    }
  }

  dispatchEvent(event) {
    if (this._eventListeners[event.type]) {
      this._eventListeners[event.type].forEach(callback => callback(event));
    }
  }

  scrollTo(options) {
    if (typeof options === 'object') {
      this.scrollY = options.top !== undefined ? options.top : this.scrollY;
      this.scrollX = options.left !== undefined ? options.left : this.scrollX;
    }
  }

  close() {
    console.log('MockWindow: close() called');
  }
}

// 模拟Chrome API
class MockChrome {
  constructor() {
    this.tabs = {
      query: (queryInfo, callback) => {
        callback([{
          id: 1,
          url: 'http://example.com',
          status: 'complete'
        }]);
      }
    };
    
    this.scripting = {
      insertCSS: (details, callback) => {
        console.log('MockChrome.scripting.insertCSS:', details.css.substring(0, 100) + '...');
        if (callback) callback();
      },
      executeScript: (details, callback) => {
        console.log('MockChrome.scripting.executeScript: executing function');
        // 模拟脚本执行，直接调用提供的函数
        let result;
        try {
          if (details.func) {
            result = details.func(...(details.args || []));
          }
          if (callback) callback([{ result: result }]);
        } catch (error) {
          console.error('MockChrome.scripting.executeScript error:', error);
          if (callback) callback([{ result: { error: error.message, stack: error.stack } }]);
        }
      }
    };
    
    this.notifications = {
      create: (options, callback) => {
        console.log('MockChrome.notifications.create:', options.title, options.message);
        if (callback) callback('mock-notification-id');
      },
      getAll: (callback) => {
        callback({});
      },
      clear: (notificationId, callback) => {
        console.log('MockChrome.notifications.clear:', notificationId);
        if (callback) callback(true);
      }
    };
    
    this.runtime = {
      lastError: null
    };
  }
}

// 导出模拟环境函数
function setupMockEnvironment() {
  global.document = new MockDocument();
  global.window = new MockWindow();
  global.NodeFilter = {
    SHOW_TEXT: 4
  };
  global.chrome = new MockChrome();
  global.Node = {
    TEXT_NODE: 3,
    ELEMENT_NODE: 1
  };
  global.DOMParser = MockDOMParser;
  
  // 模拟console对象
  global.console = {
    log: console.log.bind(console, '[Mock]'),
    error: console.error.bind(console, '[Mock Error]'),
    warn: console.warn.bind(console, '[Mock Warn]'),
    info: console.info.bind(console, '[Mock Info]')
  };
  
  // 模拟setTimeout和clearTimeout
  global.setTimeout = setTimeout;
  global.clearTimeout = clearTimeout;
  
  console.log('[Mock] 测试环境设置完成');
}

// 创建测试DOM结构
function createTestDOMStructure() {
    console.log('[Mock] 创建测试DOM结构');
    
    // 直接创建MockElement结构，确保包含正确的文本节点
    const bodyElement = new MockElement('body');
    
    // 创建内容容器
    const contentDiv = new MockElement('div');
    contentDiv.className = 'content';
    
    // 创建段落1 - 包含search关键词
    const p1 = new MockElement('p');
    p1.childNodes = [{
        nodeType: 3,
        textContent: '这是包含search关键词的文本段落。'
    }];
    
    // 创建段落2 - 包含SEARCH大写关键词
    const p2 = new MockElement('p');
    p2.childNodes = [{
        nodeType: 3,
        textContent: '这是另一个SEARCH大写关键词的段落。'
    }];
    
    // 创建段落3 - 包含search关键词（第三个匹配项）
    const p3 = new MockElement('p');
    p3.childNodes = [{
        nodeType: 3,
        textContent: '这是第三个段落，也包含search关键词和test测试单词。'
    }];
    
    // 创建段落4 - 包含数字和邮箱
    const p4 = new MockElement('p');
    p4.childNodes = [{
        nodeType: 3,
        textContent: '这里包含数字123和456，以及邮箱test@example.com。'
    }];
    
    // 组装DOM结构
    contentDiv.appendChild(p1);
    contentDiv.appendChild(p2);
    contentDiv.appendChild(p3);
    contentDiv.appendChild(p4);
    
    bodyElement.appendChild(contentDiv);
    
    // 记录创建的DOM结构信息
    console.log(`[Mock] 创建了DOM结构: body > div.content > 4个段落`);
    console.log(`[Mock] 文本内容包含: search, SEARCH, test, 123, 456, test@example.com`);
    
    return bodyElement;
}

// 导出函数
module.exports = {
  setupMockEnvironment,
  createTestDOMStructure,
  MockDocument,
  MockElement,
  MockWindow,
  MockChrome
};