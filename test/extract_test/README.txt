众筹出题器 - 导出包说明
==========================

导出内容:
  adddata_export.json  - JSON格式数据文件（推荐导入格式）
  adddata_export.sql   - SQL格式数据文件
  manifest.json        - 导出清单（包含了哪些地图和图片）
  README.txt           - 本说明文件
  tiles/               - 自定义地图瓦片（如果使用了自定义地图）
  images/              - 事件相关图片（如果有）

导入步骤:
  1. 打开 adddatatools 管理后台
  2. 进入"数据导出/导入"页面
  3. 选择 adddata_export.json 文件并导入
  4. 如果有 tiles/ 目录，将其内容复制到 adddatatools/tiles/ 目录下
  5. 如果有 images/ 目录，将其内容复制到 ww/static/images/ 目录下

注意事项:
  - 导入时如果编码已存在会自动跳过，不会覆盖已有数据
  - 地图、分类使用 code 编码作为唯一标识
  - 子分类、事件通过 code 编码关联到父级

