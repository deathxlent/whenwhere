# 何时何地 - 图片猜猜看 Demo

## 启动方式

> ⚠️ **注意：不能直接双击 index.html 打开！**
> 
> 由于浏览器安全策略限制，`file://` 协议下无法加载地图瓦片和图片资源。必须通过 HTTP 服务器访问。

### 方式一：双击启动脚本（推荐）

双击 `start.bat` 文件，然后在浏览器访问：
```
http://localhost:8080
```

停止服务器：在命令行窗口按 `Ctrl+C`

### 方式二：使用 Python（如果已安装）

```bash
cd ww-demo
python -m http.server 8080
```

然后访问 `http://localhost:8080`

### 方式三：使用 VS Code Live Server

1. 安装 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 插件
2. 右键 `index.html` → 选择 `Open with Live Server`
3. 浏览器会自动打开

### 方式四：使用 Node.js http-server

```bash
cd ww-demo
npx http-server -p 8080
```

然后访问 `http://localhost:8080`

## 游戏说明

1. 点击 **🎲 随机开始** 按钮
2. 根据图片提示，在地图上点击猜测位置
3. 输入猜测年代
4. 提交答案查看得分
5. 点击 **再来一局** 继续游戏

## 功能特性

- 🎲 随机出题（共 6 道题目）
- 🗺️ 动态地图（中国地图/世界地图/自定义地图）
- 📍 地图标点猜测
- ⏰ 年代猜测
- 📊 得分计算（位置得分 + 时间得分）
- ⭐ 收藏系统
- 🏆 成就系统
- 📈 个人统计

## 数据存储

所有数据使用 `localStorage` 存储在浏览器中，刷新页面数据不会丢失。

## 部署

直接将 `ww-demo` 目录部署到网站子目录即可，例如：
```
xxx.cn/site/ww-demo/
```

无需后端服务器，纯静态页面。
