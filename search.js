// 搜索状态
const searchState = {
  searchTerm: '',
  caseSensitive: false,
  wholeWord: false,
  regex: false,
  matches: [],
  currentMatchIndex: -1
};

// 初始化搜索界面
function initializeSearchUI() {
  try {
    // 获取DOM元素
    const searchInput = document.getElementById('search-input');
    const caseSensitiveBtn = document.getElementById('case-sensitive-btn');
    const wholeWordBtn = document.getElementById('whole-word-btn');
    const regexBtn = document.getElementById('regex-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const matchInfo = document.getElementById('match-info');
    const closeBtn = document.getElementById('close-btn');
    
    // 绑定事件监听器
    searchInput.addEventListener('input', handleSearchInput);
    caseSensitiveBtn.addEventListener('click', () => toggleSearchOption('caseSensitive', caseSensitiveBtn));
    wholeWordBtn.addEventListener('click', () => toggleSearchOption('wholeWord', wholeWordBtn));
    regexBtn.addEventListener('click', () => toggleSearchOption('regex', regexBtn));
    
    // 测试模式按钮已移除
    prevBtn.addEventListener('click', () => navigateMatches(-1));
    nextBtn.addEventListener('click', () => navigateMatches(1));
    closeBtn.addEventListener('click', () => window.close());
    
    // 监听ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.close();
      }
    });
    
    // 自动聚焦输入框
    searchInput.focus();
    
    // 清除之前可能的页面注入
    clearHighlightsInActiveTab();
  } catch (error) {
    console.error('AdvancedFind: 初始化搜索界面失败:', error);
  }
}

// 处理搜索输入
function handleSearchInput(e) {
  searchState.searchTerm = e.target.value;
  performSearch();
}

// 切换搜索选项
function toggleSearchOption(option, button) {
  searchState[option] = !searchState[option];
  button.classList.toggle('active', searchState[option]);
  performSearch();
}

// 执行搜索前先清理
function beforeSearch() {
  // 清除之前的高亮
  clearHighlightsInActiveTab();
  
  // 如果搜索词为空，不执行搜索
  if (!searchState.searchTerm || searchState.searchTerm.trim() === '') {
    searchState.matches = [];
    searchState.currentMatchIndex = -1;
    updateMatchInfo();
    return false;
  }
  
  // 短搜索词提示已移除
  
  return true;
}

// 处理搜索结果的函数
function processSearchResults(matches) {
  console.log('AdvancedFind: 搜索到的匹配项:', matches);
  searchState.matches = matches;
  searchState.currentMatchIndex = -1;
  
  // 如果匹配项过多，提供提示
  if (matches.length >= 5000) {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/images/icon128.png',
        title: '搜索结果过多',
        message: '已显示前5000个匹配项。为获得更好的性能，请使用更长的搜索词或启用全词匹配。'
      });
      
      setTimeout(() => {
        chrome.notifications.getAll((notifications) => {
          for (let id in notifications) {
            if (notifications[id].title === '搜索结果过多') {
              chrome.notifications.clear(id);
            }
          }
        });
      }, 5000);
    }
  }
  
  // 如果有匹配项，默认选中第一个
  if (matches.length > 0) {
    navigateMatches(1);
  } else {
    updateMatchInfo();
  }
}

// 执行搜索
function performSearch() {
  console.log('AdvancedFind: 开始执行搜索:', searchState.searchTerm);
  
  // 执行搜索前的清理和验证
  if (!beforeSearch()) {
    return;
  }
  
  // 移除了测试模式相关代码
  
  // 获取当前活动标签页
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('AdvancedFind: 获取到标签页:', tabs);
    if (tabs.length === 0) {
      console.error('AdvancedFind: 未找到活动标签页');
      return;
    }
    
    const tabId = tabs[0].id;
    console.log('AdvancedFind: 活动标签页ID:', tabId);
    const { searchTerm, caseSensitive, wholeWord, regex } = searchState;
    
    // 检查标签页状态
    console.log('AdvancedFind: 标签页URL:', tabs[0].url);
    console.log('AdvancedFind: 标签页状态:', tabs[0].status);
    
    // 检查标签页是否可访问
    if (!tabs[0].url.startsWith('http://') && !tabs[0].url.startsWith('https://')) {
      console.error('AdvancedFind: 标签页URL不是http或https协议，无法注入脚本');
      return;
    }
    
    // 先注入CSS样式
    console.log('AdvancedFind: 准备注入CSS样式');
    chrome.scripting.insertCSS({
      target: { tabId: tabId },
      css: `
        .advanced-find-highlight {
          background-color: #ffeb3b;
          border-radius: 2px;
          padding: 0 2px;
        }
        .advanced-find-highlight.active {
          background-color: #ff9800;
          color: white;
        }
      `
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('AdvancedFind: CSS注入失败:', chrome.runtime.lastError);
        return;
      }
      console.log('AdvancedFind: CSS样式注入成功');
      
      // 然后注入搜索脚本
      console.log('AdvancedFind: 准备注入搜索脚本');
      console.log('AdvancedFind: 脚本参数:', { searchTerm, caseSensitive, wholeWord, regex });
      
      // 尝试使用executeScript注入脚本
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: function(searchTerm, caseSensitive, wholeWord, regex) {
          try {
            // 定义findMatchesInPage函数及其依赖函数，这些将在页面环境中执行
            function getVisibleTextNodes(element) {
              const allTextNodes = [];
              if (!element) return [];
              
              try {
                const treeWalker = document.createTreeWalker(
                  element,
                  NodeFilter.SHOW_TEXT,
                  null,
                  false
                );
                
                let node;
                while ((node = treeWalker.nextNode())) {
                  if (node.textContent.trim()) {
                    allTextNodes.push(node);
                  }
                }
              } catch (error) {
                console.error('AdvancedFind: 获取文本节点出错:', error);
              }
              
              return allTextNodes;
            }
            
            function findMatchesInText(textNode, searchTerm, caseSensitive, wholeWord, regex) {
              if (!textNode || !textNode.textContent) return [];
              
              const text = textNode.textContent;
              const matches = [];
              let match;
              
              try {
                let regexPattern;
                
                if (regex) {
                  // 正则表达式模式 - 正确应用大小写匹配标志
                  console.log('AdvancedFind: 正则表达式搜索模式 - 大小写敏感:', caseSensitive);
                  // 确保正确设置正则表达式标志
                  const flags = caseSensitive ? 'g' : 'gi';
                  regexPattern = new RegExp(searchTerm, flags);
                } else {
                  // 普通文本搜索 - 正确应用大小写匹配标志
                  let escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  if (wholeWord) {
                    escapedTerm = '\\b' + escapedTerm + '\\b';
                  }
                  console.log('AdvancedFind: 普通文本搜索模式 - 大小写敏感:', caseSensitive);
                  // 确保正确设置正则表达式标志
                  const flags = caseSensitive ? 'g' : 'gi';
                  regexPattern = new RegExp(escapedTerm, flags);
                }
                
                while ((match = regexPattern.exec(text)) !== null) {
                  matches.push({
                    index: match.index,
                    text: match[0]
                  });
                  
                  if (match.index === regexPattern.lastIndex) {
                    regexPattern.lastIndex++;
                  }
                }
              } catch (error) {
                console.error('AdvancedFind: 正则表达式错误:', error);
              }
              
              return matches;
            }
            
            function findMatchesInPage(searchTerm, caseSensitive, wholeWord, regex) {
              try {
                // 先清除之前的高亮
                const highlights = document.querySelectorAll('.advanced-find-highlight');
                highlights.forEach(highlight => {
                  const parent = highlight.parentNode;
                  if (parent) {
                    const text = highlight.textContent;
                    const textNode = document.createTextNode(text);
                    parent.replaceChild(textNode, highlight);
                    parent.normalize();
                  }
                });
                
                // 获取文档中所有可见文本节点
                const textNodes = getVisibleTextNodes(document.body);
                
                // 存储所有匹配项
                const matches = [];
                let matchIndex = 0;
                
                // 遍历所有文本节点查找匹配
                textNodes.forEach((node, index) => {
                  const nodeMatches = findMatchesInText(node, searchTerm, caseSensitive, wholeWord, regex);
                  if (nodeMatches.length > 0) {
                    matches.push(...nodeMatches);
                    matchIndex += nodeMatches.length;
                  }
                });
                
                // 创建高亮元素
                if (matches.length > 0) {
                  try {
                    // 为匹配项创建高亮
                    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
                    textNodes.forEach((node, index) => {
                      const nodeMatches = sortedMatches.filter(m => {
                        // 简单的匹配位置检查
                        const nodeContent = node.textContent;
                        return nodeContent.indexOf(m.text) !== -1;
                      });
                       
                      if (nodeMatches.length > 0 && node.parentNode) {
                        const parent = node.parentNode;
                        const originalText = node.textContent;
                        const fragment = document.createDocumentFragment();
                        let lastIndex = 0;
                        
                        // 创建高亮元素
                        nodeMatches.forEach((match, i) => {
                          const matchIndex = originalText.indexOf(match.text, lastIndex);
                          if (matchIndex !== -1) {
                            if (matchIndex > lastIndex) {
                              fragment.appendChild(document.createTextNode(originalText.substring(lastIndex, matchIndex)));
                            }
                            
                            const highlightSpan = document.createElement('span');
                            highlightSpan.className = 'advanced-find-highlight';
                            highlightSpan.dataset.matchIndex = (index * 1000) + i; // 生成唯一索引
                            highlightSpan.textContent = match.text;
                            fragment.appendChild(highlightSpan);
                            
                            lastIndex = matchIndex + match.text.length;
                          }
                        });
                        
                        if (lastIndex < originalText.length) {
                          fragment.appendChild(document.createTextNode(originalText.substring(lastIndex)));
                        }
                        
                        parent.replaceChild(fragment, node);
                      }
                    });
                  } catch (error) {
                    console.error('AdvancedFind: 创建高亮失败:', error);
                  }
                }
                
                return matches;
              } catch (error) {
                console.error('AdvancedFind: 页面搜索出错:', error);
                return [];
              }
            }
            
            console.log('AdvancedFind: 页面脚本开始执行');
            console.log('AdvancedFind: 页面URL:', window.location.href);
            console.log('AdvancedFind: 搜索参数:', { searchTerm, caseSensitive, wholeWord, regex });
            
            // 执行实际的页面搜索
            return findMatchesInPage(searchTerm, caseSensitive, wholeWord, regex);
          } catch (error) {
            console.error('AdvancedFind: 页面脚本执行出错:', error);
            console.error('AdvancedFind: 错误堆栈:', error.stack);
            return { error: error.message, stack: error.stack };
          }
        },
        args: [searchTerm, caseSensitive, wholeWord, regex]
      }, (results) => {
        console.log('AdvancedFind: 脚本执行结果:', results);
        
        if (chrome.runtime.lastError) {
          console.error('AdvancedFind: 搜索脚本执行失败:', chrome.runtime.lastError);
          console.error('AdvancedFind: 错误详情:', JSON.stringify(chrome.runtime.lastError));
          
          // 显示通知给用户
          if (chrome.notifications) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: '/images/icon128.png',
              title: '搜索失败',
              message: '无法在当前页面执行搜索。错误: ' + chrome.runtime.lastError.message + '\n请查看控制台了解更多详情。'
            });
          } else {
            // 如果通知API不可用，通过控制台向用户显示信息
            console.log('AdvancedFind: 请启用浏览器通知功能以获取更好的用户体验。');
          }
          
          searchState.matches = [];
          searchState.currentMatchIndex = -1;
          updateMatchInfo();
          return;
        }
        
        if (!results || results.length === 0) {
          console.error('AdvancedFind: 脚本执行返回空结果');
          searchState.matches = [];
          searchState.currentMatchIndex = -1;
          updateMatchInfo();
          return;
        }
        
        // 检查结果中是否有错误
        if (results[0].result && results[0].result.error) {
          console.error('AdvancedFind: 页面脚本执行出错:', results[0].result.error);
          searchState.matches = [];
          searchState.currentMatchIndex = -1;
          updateMatchInfo();
          return;
        }
        
        // 获取搜索结果并处理
        const matches = results[0].result || [];
        processSearchResults(matches);
      });
    });
  });
}

// 在页面中查找匹配项（将在标签页环境中执行）
function findMatchesInPage(searchTerm, caseSensitive, wholeWord, regex) {
  try {
    console.log('AdvancedFind: 页面中执行搜索:', {searchTerm, caseSensitive, wholeWord, regex});
    
    // 测试：在控制台显示一些页面内容预览
    console.log('AdvancedFind: 页面标题:', document.title);
    console.log('AdvancedFind: 页面正文预览:', document.body.textContent.substring(0, 100) + '...');
    
    // 获取文档中所有可见文本节点
    console.log('AdvancedFind: 开始获取文本节点...');
    const textNodes = getVisibleTextNodes(document.body);
    console.log('AdvancedFind: 找到文本节点数量:', textNodes.length);
    
    // 预览前3个文本节点的内容
    if (textNodes.length > 0) {
      const previewCount = Math.min(3, textNodes.length);
      for (let i = 0; i < previewCount; i++) {
        const nodeContent = textNodes[i].textContent;
        console.log(`AdvancedFind: 文本节点 ${i} 内容预览:`, nodeContent.substring(0, 50) + '...');
        // 检查这个节点是否包含搜索词
        if (nodeContent.includes(searchTerm)) {
          console.log(`AdvancedFind: 文本节点 ${i} 包含搜索词`);
        }
      }
    }
    
    // 存储所有匹配项
    const matches = [];
    let matchIndex = 0;
    
    // 遍历所有文本节点查找匹配
    console.log('AdvancedFind: 开始遍历文本节点查找匹配...');
    textNodes.forEach((node, index) => {
      // 为前5个节点添加详细日志
      if (index < 5) {
        console.log(`AdvancedFind: 处理文本节点 ${index}:`);
      }
      const nodeMatches = findMatchesInText(node, searchTerm, caseSensitive, wholeWord, regex, matchIndex);
      if (nodeMatches.length > 0) {
        console.log(`AdvancedFind: 文本节点 ${index} 找到 ${nodeMatches.length} 个匹配项`);
        matches.push(...nodeMatches);
        matchIndex += nodeMatches.length;
      }
    });
    
    console.log('AdvancedFind: 总共找到匹配项数量:', matches.length);
    return matches;
  } catch (error) {
    console.error('AdvancedFind: 页面搜索出错:', error);
    // 输出错误堆栈以帮助调试
    console.error('AdvancedFind: 错误堆栈:', error.stack);
    return [];
  }
}

// 获取可见的文本节点（将在标签页环境中执行）
function getVisibleTextNodes(element) {
  console.log('AdvancedFind: getVisibleTextNodes - 开始获取可见文本节点');
  console.log('AdvancedFind: getVisibleTextNodes - 传入的元素:', element.tagName || 'document');
  
  // 简化的文本节点获取方法，避免过滤过于严格
  const allTextNodes = [];
  
  // 检查element是否存在
  if (!element) {
    console.error('AdvancedFind: getVisibleTextNodes - 传入的元素不存在');
    return [];
  }
  
  try {
    // 创建TreeWalker
    const treeWalker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    console.log('AdvancedFind: getVisibleTextNodes - TreeWalker创建成功');
    
    let node;
    let nodeCount = 0;
    let emptyNodeCount = 0;
    
    // 遍历所有文本节点
    while ((node = treeWalker.nextNode())) {
      nodeCount++;
      // 只过滤空文本节点
      if (node.textContent.trim()) {
        allTextNodes.push(node);
      } else {
        emptyNodeCount++;
      }
    }
    
    console.log('AdvancedFind: getVisibleTextNodes - 总文本节点数:', nodeCount);
    console.log('AdvancedFind: getVisibleTextNodes - 空文本节点数:', emptyNodeCount);
    console.log('AdvancedFind: getVisibleTextNodes - 非空文本节点数（返回的节点数）:', allTextNodes.length);
  } catch (error) {
    console.error('AdvancedFind: getVisibleTextNodes - 获取文本节点出错:', error);
    console.error('AdvancedFind: getVisibleTextNodes - 错误堆栈:', error.stack);
  }
  
  return allTextNodes;
}

// 在文本中查找匹配项（将在标签页环境中执行）
function findMatchesInText(textNode, searchTerm, caseSensitive, wholeWord, regex, startIndex) {
  console.log('AdvancedFind: findMatchesInText - 开始在文本节点中查找匹配项');
  
  // 检查参数
  if (!textNode || !textNode.textContent) {
    console.error('AdvancedFind: findMatchesInText - 无效的文本节点');
    return [];
  }
  
  const text = textNode.textContent;
  const matches = [];
  let match;
  
  try {
    let regexPattern;
    let regexString = '';
    
    if (regex) {
      // 正则表达式模式 - 正确应用大小写匹配标志
      console.log('AdvancedFind: findMatchesInText - 使用正则表达式搜索:', searchTerm, '大小写敏感:', caseSensitive);
      regexString = searchTerm;
      // 确保正确设置正则表达式标志
      const flags = caseSensitive ? 'g' : 'gi';
      regexPattern = new RegExp(searchTerm, flags);
    } else {
      // 普通文本搜索 - 正确应用大小写匹配标志
      let escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) {
        escapedTerm = '\\b' + escapedTerm + '\\b';
        console.log('AdvancedFind: findMatchesInText - 启用全词匹配');
      }
      regexString = escapedTerm;
      // 确保正确设置正则表达式标志
      const flags = caseSensitive ? 'g' : 'gi';
      regexPattern = new RegExp(escapedTerm, flags);
      console.log('AdvancedFind: findMatchesInText - 构建的正则表达式:', regexString, '大小写敏感:', caseSensitive);
    }
    
    // 检查文本是否包含搜索词（简单检查，用于调试）
    const simpleCheck = caseSensitive ? text.includes(searchTerm) : text.toLowerCase().includes(searchTerm.toLowerCase());
    console.log('AdvancedFind: findMatchesInText - 文本简单检查是否包含搜索词:', simpleCheck);
    
    // 查找匹配项，但限制总数
    console.log('AdvancedFind: findMatchesInText - 开始执行正则匹配');
    while ((match = regexPattern.exec(text)) !== null) {
      const matchIndex = startIndex + matches.length;
      console.log('AdvancedFind: findMatchesInText - 找到匹配项:', {
        matchText: match[0],
        matchIndex: match.index,
        globalIndex: matchIndex
      });
      
      matches.push({
        index: match.index, // 匹配项在文本中的实际位置
        text: match[0]     // 匹配的文本内容
      });
      
      // 防止零宽度匹配导致的无限循环
      if (match.index === regexPattern.lastIndex) {
        regexPattern.lastIndex++;
        console.log('AdvancedFind: findMatchesInText - 防止零宽度匹配，lastIndex增加');
      }
      
      // 限制匹配项数量，避免页面卡死
      if (matches.length >= 5000) {
        console.log('AdvancedFind: findMatchesInText - 匹配项数量超过上限(5000)，停止搜索');
        break;
      }
      
      // 限制日志记录数量
      if (matches.length > 100) {
        console.log('AdvancedFind: findMatchesInText - 匹配项过多，停止记录详细日志');
      }
    }
    
    console.log('AdvancedFind: findMatchesInText - 找到的匹配项总数:', matches.length);
  } catch (error) {
    console.error('AdvancedFind: findMatchesInText - 正则表达式错误:', error);
    console.error('AdvancedFind: findMatchesInText - 错误堆栈:', error.stack);
  }
  
  return matches;
}

// 创建高亮元素（将在标签页环境中执行）
function createHighlights(textNode, matches, startIndex) {
  console.log('AdvancedFind: 创建高亮:', {matches, startIndex});
  if (matches.length === 0) return;
  
  const parent = textNode.parentNode;
  if (!parent) return;
  
  // 保存原始文本内容
  const originalText = textNode.textContent;
  
  // 创建一个新的文档片段来保存分割后的节点
  const fragment = document.createDocumentFragment();
  
  // 按照匹配位置进行排序
  const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
  
  let lastIndex = 0;
  
  // 遍历所有匹配项
  for (let i = 0; i < sortedMatches.length; i++) {
    const match = sortedMatches[i];
    
    // 检查匹配项的text属性是否存在
    if (!match.text) continue;
    
    // 查找匹配项在文本中的位置
    const matchIndex = originalText.indexOf(match.text, lastIndex);
    if (matchIndex === -1) continue;
    
    // 添加匹配项之前的文本节点
    if (matchIndex > lastIndex) {
      const beforeText = originalText.substring(lastIndex, matchIndex);
      fragment.appendChild(document.createTextNode(beforeText));
    }
    
    // 创建高亮元素并添加到文档片段
    const highlightSpan = document.createElement('span');
    highlightSpan.className = 'advanced-find-highlight';
    highlightSpan.dataset.matchIndex = i + startIndex;
    highlightSpan.textContent = match.text;
    fragment.appendChild(highlightSpan);
    
    // 更新最后处理位置
    lastIndex = matchIndex + match.text.length;
  }
  
  // 添加最后一个匹配项之后的文本节点
  if (lastIndex < originalText.length) {
    const afterText = originalText.substring(lastIndex);
    fragment.appendChild(document.createTextNode(afterText));
  }
  
  // 替换原始文本节点
  parent.replaceChild(fragment, textNode);
}

// 清除所有高亮（将在标签页环境中执行）
function clearHighlights() {
  const highlights = document.querySelectorAll('.advanced-find-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    if (parent) {
      const text = highlight.textContent;
      const textNode = document.createTextNode(text);
      parent.replaceChild(textNode, highlight);
      
      // 合并相邻的文本节点
      parent.normalize();
    }
  });
}

// 在活动标签页中清除高亮
function clearHighlightsInActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: clearHighlights
    });
  });
}

// 导航到上一个或下一个匹配项
function navigateMatches(direction) {
  const { matches, currentMatchIndex } = searchState;
  
  if (matches.length === 0) return;
  
  // 计算新的索引
  searchState.currentMatchIndex = (currentMatchIndex + direction + matches.length) % matches.length;
  
  // 更新标签页中的高亮状态
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    
    const tabId = tabs[0].id;
    const newIndex = searchState.currentMatchIndex;
    
    // 先注入CSS样式，确保高亮显示正常
    chrome.scripting.insertCSS({
      target: { tabId: tabId },
      css: `
        .advanced-find-highlight {
          background-color: #ffeb3b;
          border-radius: 2px;
          padding: 0 2px;
        }
        .advanced-find-highlight.active {
          background-color: #ff9800;
          color: white;
        }
      `
    }, () => {
      // 然后执行更新活动高亮的脚本
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: function(prevIndex, newIndex, matches, caseSensitive) {
          // 清除所有现有高亮
          const existingHighlights = document.querySelectorAll('.advanced-find-highlight');
          existingHighlights.forEach(highlight => {
            const parent = highlight.parentNode;
            if (parent) {
              const text = highlight.textContent;
              const textNode = document.createTextNode(text);
              parent.replaceChild(textNode, highlight);
              parent.normalize();
            }
          });
          
          // 为当前匹配项创建高亮并滚动到视图
          try {
            // 重新创建TreeWalker以找到所有文本节点
            const treeWalker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            let node;
            let globalMatchIndex = 0;
            let foundMatch = false;
            
            // 遍历所有文本节点查找当前匹配项
            while ((node = treeWalker.nextNode()) && !foundMatch) {
              if (!node.textContent.trim()) continue;
              
              // 查找当前节点中的所有匹配
              let regexPattern;
              const searchTerm = matches[newIndex].text;
              
              // 创建正则表达式，根据caseSensitive参数决定是否忽略大小写
              console.log('AdvancedFind: 导航匹配项 - 大小写敏感:', caseSensitive);
              const flags = caseSensitive ? 'g' : 'gi';
              regexPattern = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
              
              let match;
              while ((match = regexPattern.exec(node.textContent)) !== null) {
                if (globalMatchIndex === newIndex) {
                  // 找到了目标匹配项，创建高亮
                  const parent = node.parentNode;
                  if (parent) {
                    // 分割文本节点
                    const beforeText = node.textContent.substring(0, match.index);
                    const matchText = match[0];
                    const afterText = node.textContent.substring(match.index + matchText.length);
                    
                    // 创建新的文本节点和高亮节点
                    const beforeNode = document.createTextNode(beforeText);
                    const highlightSpan = document.createElement('span');
                    highlightSpan.className = 'advanced-find-highlight active';
                    highlightSpan.dataset.matchIndex = newIndex;
                    highlightSpan.textContent = matchText;
                    const afterNode = document.createTextNode(afterText);
                    
                    // 替换原始节点
                    parent.insertBefore(beforeNode, node);
                    parent.insertBefore(highlightSpan, node);
                    parent.insertBefore(afterNode, node);
                    parent.removeChild(node);
                    
                    // 滚动到高亮元素 - 使用更可靠的滚动方法
                    try {
                      // 方法1: 先尝试使用scrollIntoView
                      highlightSpan.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center', 
                        inline: 'center'
                      });
                      
                      // 方法2: 添加延时后再次检查并滚动，确保元素可见
                      setTimeout(() => {
                        const rect = highlightSpan.getBoundingClientRect();
                        if (rect.top < 0 || rect.bottom > window.innerHeight || 
                            rect.left < 0 || rect.right > window.innerWidth) {
                          // 如果元素仍然不在视窗内，使用window.scrollTo强制滚动
                          window.scrollTo({
                            top: window.scrollY + rect.top - 100, // 添加偏移量以确保元素可见
                            left: window.scrollX + rect.left - 50,
                            behavior: 'smooth'
                          });
                          
                          // 方法3: 最后再尝试一次，确保万无一失
                          setTimeout(() => {
                            highlightSpan.scrollIntoView({ 
                              behavior: 'instant', // 最后一次使用即时滚动
                              block: 'center', 
                              inline: 'center'
                            });
                          }, 100);
                        }
                      }, 200);
                    } catch (scrollError) {
                      console.error('AdvancedFind: 滚动到高亮元素失败:', scrollError);
                    }
                  }
                  
                  foundMatch = true;
                  break;
                }
                
                globalMatchIndex++;
                
                // 防止零宽度匹配导致的无限循环
                if (match.index === regexPattern.lastIndex) {
                  regexPattern.lastIndex++;
                }
              }
            }
          } catch (error) {
            console.error('AdvancedFind: 创建高亮并滚动失败:', error);
          }
        },
        args: [currentMatchIndex, newIndex, matches, searchState.caseSensitive]
      });
    });
  });
  
  updateMatchInfo();
}

// 更新活动高亮项（将在标签页环境中执行）
function updateActiveHighlight(prevIndex, newIndex) {
  // 移除前一个高亮的激活状态
  if (prevIndex >= 0) {
    const prevHighlight = document.querySelector(`.advanced-find-highlight[data-match-index="${prevIndex}"]`);
    if (prevHighlight) {
      prevHighlight.classList.remove('active');
    }
  }
  
  // 添加新的激活状态
  const newHighlight = document.querySelector(`.advanced-find-highlight[data-match-index="${newIndex}"]`);
  if (newHighlight) {
    newHighlight.classList.add('active');
    
    // 滚动到视图
    newHighlight.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }
}

// 更新匹配信息显示
function updateMatchInfo() {
  console.log('AdvancedFind: 更新匹配信息:', {currentMatchIndex: searchState.currentMatchIndex, matchesCount: searchState.matches.length});
  const matchInfo = document.getElementById('match-info');
  if (matchInfo) {
    const { matches, currentMatchIndex } = searchState;
    const current = matches.length > 0 ? (currentMatchIndex + 1) : 0;
    matchInfo.textContent = `${current}/${matches.length}`;
  }
}

// 初始化扩展
initializeSearchUI();