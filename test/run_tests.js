// run_tests.js - 在Node.js环境中运行AdvancedFind扩展的测试

/**
 * 检测Node.js是否安装
 * @returns {Object} 包含是否安装和版本信息
 */
function checkNodeJsInstallation() {
  const { execSync } = require('child_process');
  
  try {
    // 尝试执行node -v命令
    const versionOutput = execSync('node -v', { encoding: 'utf8' }).trim();
    
    // 解析版本号
    const versionMatch = versionOutput.match(/v(\d+)\.(\d+)\.(\d+)/);
    if (versionMatch) {
      const [, major, minor, patch] = versionMatch;
      return {
        isInstalled: true,
        version: versionOutput,
        major: parseInt(major),
        minor: parseInt(minor),
        patch: parseInt(patch),
        isValid: true
      };
    } else {
      return {
        isInstalled: true,
        version: versionOutput,
        isValid: false,
        error: '无法解析Node.js版本号'
      };
    }
  } catch (error) {
    return {
      isInstalled: false,
      error: '未找到Node.js或无法执行node命令'
    };
  }
}

/**
 * 显示如何安装Node.js的说明
 */
function showNodeJsInstallationInstructions() {
  console.log('\n====================================');
  console.log('Node.js 安装指南');
  console.log('====================================');
  console.log('');
  console.log('如果您的系统中未安装Node.js，请按照以下步骤安装：');
  console.log('');
  console.log('1. 访问官方网站: https://nodejs.org/');
  console.log('2. 下载适合您操作系统的LTS（长期支持）版本');
  console.log('3. 运行安装程序并按照提示完成安装');
  console.log('4. 安装完成后，打开新的命令提示符或终端窗口');
  console.log('5. 运行命令 "node -v" 验证安装是否成功');
  console.log('');
  console.log('对于Windows用户，您也可以使用Chocolatey包管理器安装：');
  console.log('choco install nodejs-lts');
  console.log('');
  console.log('对于macOS用户，您可以使用Homebrew安装：');
  console.log('brew install node');
  console.log('');
  console.log('对于Linux用户，各发行版有不同的包管理器命令：');
  console.log('- Ubuntu/Debian: sudo apt install nodejs npm');
  console.log('- Fedora: sudo dnf install nodejs npm');
  console.log('- CentOS/RHEL: sudo yum install nodejs npm');
  console.log('');
  console.log('安装完成后，请重新运行此脚本。');
  console.log('====================================');
}

/**
 * 主函数，运行测试
 */
function main() {
  console.log('====================================');
  console.log('AdvancedFind 扩展测试运行器');
  console.log('====================================');
  
  // 检查Node.js安装
  console.log('\n正在检查Node.js安装...');
  const nodeInfo = checkNodeJsInstallation();
  
  if (!nodeInfo.isInstalled) {
    console.error(`错误: ${nodeInfo.error}`);
    showNodeJsInstallationInstructions();
    return;
  } else if (!nodeInfo.isValid) {
    console.warn(`警告: ${nodeInfo.error}`);
    console.log(`检测到的版本输出: ${nodeInfo.version}`);
  } else {
    console.log(`Node.js 已安装: ${nodeInfo.version}`);
    
    // 检查Node.js版本要求
    const requiredMajor = 12;
    if (nodeInfo.major < requiredMajor) {
      console.warn(`警告: 推荐使用 Node.js v${requiredMajor} 或更高版本，当前版本: ${nodeInfo.version}`);
    }
  }
  
  console.log('\n开始运行测试...');
  
  try {
    // 动态导入测试模块
    const testModule = require('./test_search');
    
    // 运行测试
    testModule.runTests();
    
    console.log('\n====================================');
    console.log('测试运行完成');
    console.log('====================================');
    console.log('');
    console.log('其他测试选项:');
    console.log('1. 浏览器测试: 在浏览器中打开 test_runner.html 文件进行交互式测试');
    console.log('2. 特定测试: 编辑 test_search.js 中的测试用例以测试特定功能');
    console.log('');
  } catch (error) {
    console.error('\n测试运行出错:', error);
    console.error('错误堆栈:', error.stack);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n找不到测试模块，请确保 test_search.js 文件存在且正确。');
    }
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  main();
}

// 导出函数供其他模块使用
module.exports = {
  checkNodeJsInstallation,
  showNodeJsInstallationInstructions,
  main
};