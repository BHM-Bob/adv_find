# AdvancedFind 扩展测试说明

## 基本信息
扩展名称: AdvancedFind
版本: 1.0
功能概述: 一个增强浏览器搜索功能的工具，提供类似VSCode的高级搜索体验。

## 测试环境
- Edge浏览器版本: 最新稳定版及以上
- 操作系统: Windows 10/11、macOS、Linux
- 无需特殊账户或服务依赖

## 核心功能测试

### 1. 基础搜索功能
- 点击扩展图标打开搜索界面
- 输入搜索文本，验证实时搜索结果
- 确认所有匹配项被高亮显示
- 验证匹配计数更新正确

### 2. 搜索选项测试

#### 大小写匹配(Aa按钮)
- 启用大小写匹配，验证区分大小写的搜索结果
- 禁用大小写匹配，验证不区分大小写的搜索结果
- 在不同大小写组合的文本上测试准确性

#### 全字匹配(W按钮)
- 启用全字匹配，验证仅匹配完整单词的结果
- 禁用全字匹配，验证匹配部分单词的结果

#### 正则表达式搜索(.*按钮)
- 启用正则表达式模式，测试基本正则表达式语法
- 测试常见正则表达式: \d+ (数字)、\w+ (单词)、[a-zA-Z]+ (字母)
- 验证错误正则表达式的处理和提示

### 3. 导航功能测试
- 使用上下箭头按钮在匹配项间导航
- 验证当前匹配项有特殊高亮
- 测试循环导航(从最后一项到第一项，反之亦然)
- 确认视图自动滚动到当前匹配项

### 4. 界面交互
- 测试ESC键关闭搜索窗口
- 测试关闭按钮功能
- 验证搜索框自动聚焦
- 验证短搜索词的通知提示

## 性能测试
- 在大型页面上测试搜索性能
- 测试复杂正则表达式的处理效率
- 验证大量匹配项(>1000)的显示和导航

## 特殊情况处理
- 空搜索词的处理
- 无匹配项的情况
- 正则表达式语法错误的处理
- 短搜索词的通知提示功能

## 已知限制
- 大文件或复杂页面可能会有短暂的性能延迟
- 正则表达式必须符合JavaScript语法规范
- 仅支持在可见文本节点中搜索，不搜索隐藏内容或脚本内容

## 注意事项
- 测试前确保浏览器处于开发者模式
- 安装扩展后刷新页面再进行测试
- 测试时尽量使用不同类型的网页内容(文本密集、表格、长文章等)


---

# AdvancedFind Extension Testing Instructions

## Basic Information
Extension Name: AdvancedFind
Version: 1.0
Function Overview: A tool that enhances browser search functionalities, providing an advanced search experience similar to VSCode.

## Testing Environment
- Edge Browser Version: Latest stable version and above
- Operating Systems: Windows 10/11, macOS, Linux
- No special accounts or service dependencies required

## Core Functionality Testing

### 1. Basic Search Functionality
- Click the extension icon to open the search interface
- Input search text and verify real-time search results
- Ensure all matches are highlighted
- Verify that the match count updates correctly

### 2. Search Options Testing

#### Case Sensitivity (Aa Button)
- Enable case sensitivity, verify case-sensitive search results
- Disable case sensitivity, verify case-insensitive search results
- Test accuracy with different case combinations of text

#### Whole Word Matching (W Button)
- Enable whole word matching, verify results that only match complete words
- Disable whole word matching, verify results that match partial words

#### Regular Expression Search (.* Button)
- Enable regular expression mode, test basic regular expression syntax
- Test common regular expressions: \d+ (digits), \w+ (words), [a-zA-Z]+ (letters)
- Verify the handling and prompts for erroneous regular expressions

### 3. Navigation Functionality Testing
- Use the up and down arrow buttons to navigate through matches
- Verify that the current match is specially highlighted
- Test circular navigation (from the last item to the first, and vice versa)
- Confirm that the view automatically scrolls to the current match
- Test keyboard navigation using up/down arrow keys in the search input field
- Verify that arrow keys only navigate matches when search results exist
- Confirm that arrow keys maintain normal cursor movement when no search results are present

### 4. Interface Interaction
- Test ESC key to close the search window
- Test functionality of the close button
- Verify that the search box is automatically focused
- Verify notification prompts for short search terms
- Test that arrow keys in the search input field intelligently switch between cursor movement and result navigation

## Performance Testing
- Test search performance on large pages
- Test the efficiency of handling complex regular expressions
- Verify display and navigation of a large number of matches (>1000)

## Special Case Handling
- Handling of empty search terms
- Cases with no matches
- Handling of regular expression syntax errors
- Notification prompt functionality for short search terms
- Test arrow key behavior with single match results
- Test arrow key behavior with multiple match results
- Verify arrow keys work correctly with different search options (case sensitivity, whole word, regex)

## Known Limitations
- Large files or complex pages may experience brief performance delays
- Regular expressions must conform to JavaScript syntax rules
- Only supports searching within visible text nodes, does not search hidden content or script content
- Arrow key navigation only works when search results are present; otherwise, default cursor movement is maintained

## Notes
- Ensure the browser is in developer mode before testing
- Refresh the page after installing the extension before testing
- Try to use different types of web page content during testing (text-heavy, tables, long articles, etc.)
- When testing arrow key navigation, ensure the search input field has focus
- Test arrow key navigation with various content types including mixed-language text