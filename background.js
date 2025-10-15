// 当用户点击扩展图标时触发
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 检查是否已经注入了搜索脚本
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.advancedFindInitialized || false
    });

    if (!result) {
      // 注入搜索CSS和JS到当前页面
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['search.css']
      });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['search.js']
      });
    }
  } catch (error) {
    console.error('AdvancedFind: 注入脚本时发生错误:', error);
  }
});