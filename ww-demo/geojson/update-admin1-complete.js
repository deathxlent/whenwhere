const fs = require('fs');

// 读取现有的GeoJSON文件
const data = JSON.parse(fs.readFileSync('./world_admin1_labels.json', 'utf8'));

console.log('当前特征数量:', data.features.length);

// 创建新的行政区域特征数组
const newFeatures = [];

// 中国省级行政区
const chinaProvinces = [
  {name:'北京',lat:39.9042,lng:116.4074},{name:'天津',lat:39.3434,lng:117.3616},
  {name:'上海',lat:31.2304,lng:121.4737},{name:'重庆',lat:29.4316,lng:106.9123},
  {name:'河北',lat:38.0428,lng:114.5149},{name:'山西',lat:37.5777,lng:112.2922},
  {name:'辽宁',lat:41.2956,lng:122.6085},{name:'吉林',lat:43.6661,lng:126.1986},
  {name:'黑龙江',lat:45.7424,lng:126.6617},{name:'江苏',lat:32.0617,lng:118.7778},
  {name:'浙江',lat:30.2741,lng:120.1551},{name:'安徽',lat:31.8612,lng:117.2849},
  {name:'福建',lat:26.0745,lng:117.9874},{name:'江西',lat:27.6140,lng:115.7221},
  {name:'山东',lat:36.3427,lng:118.1498},{name:'河南',lat:33.8818,lng:113.6140},
  {name:'湖北',lat:30.5928,lng:114.3055},{name:'湖南',lat:27.6104,lng:111.7088},
  {name:'广东',lat:23.1322,lng:113.2664},{name:'海南',lat:19.1959,lng:109.7453},
  {name:'四川',lat:30.5728,lng:104.0665},{name:'贵州',lat:26.5783,lng:106.7135},
  {name:'云南',lat:25.0458,lng:101.4870},{name:'陕西',lat:34.2632,lng:108.9480},
  {name:'甘肃',lat:36.0611,lng:103.8343},{name:'青海',lat:36.6171,lng:101.7782},
  {name:'台湾',lat:23.6978,lng:120.9605},{name:'内蒙古',lat:40.8413,lng:111.7519},
  {name:'广西',lat:22.8155,lng:108.3275},{name:'西藏',lat:29.6456,lng:91.1409},
  {name:'宁夏',lat:38.4872,lng:106.2310},{name:'新疆',lat:43.8256,lng:87.6168},
  {name:'香港',lat:22.3193,lng:114.1694},{name:'澳门',lat:22.1987,lng:113.5439}
];

chinaProvinces.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '中国', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 法国大区
const franceRegions = [
  {name:'法兰西岛',lat:48.8566,lng:2.3522},{name:'普罗旺斯-阿尔卑斯-蓝色海岸',lat:43.2965,lng:5.3698},
  {name:'奥弗涅-罗讷-阿尔卑斯',lat:45.7640,lng:4.8357},{name:'新阿基坦',lat:44.8378,lng:-0.5792},
  {name:'奥克西塔尼',lat:43.6047,lng:1.4442},{name:'大东部',lat:48.5734,lng:7.7521},
  {name:'上法兰西',lat:50.6292,lng:3.0573},{name:'诺曼底',lat:49.4432,lng:1.0999},
  {name:'布列塔尼',lat:48.1173,lng:-1.6778},{name:'卢瓦尔河地区',lat:47.2184,lng:-1.5536},
  {name:'中央-卢瓦尔河谷',lat:47.9029,lng:1.9093},{name:'勃艮第-弗朗什-孔泰',lat:47.3220,lng:5.0415},
  {name:'科西嘉',lat:42.6975,lng:9.0625}
];

franceRegions.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '法国', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 德国州
const germanyStates = [
  {name:'巴伐利亚',lat:48.1351,lng:11.5820},{name:'巴登-符腾堡',lat:48.7758,lng:9.1829},
  {name:'北莱茵-威斯特法伦',lat:51.2277,lng:6.7735},{name:'下萨克森',lat:52.3759,lng:9.7320},
  {name:'黑森',lat:50.1109,lng:8.6821},{name:'莱茵兰-普法尔茨',lat:50.0000,lng:8.2711},
  {name:'萨克森',lat:51.0504,lng:13.7373},{name:'柏林',lat:52.5200,lng:13.4050},
  {name:'汉堡',lat:53.5511,lng:9.9937},{name:'石勒苏益格-荷尔斯泰因',lat:54.3233,lng:10.1228},
  {name:'梅克伦堡-前波美拉尼亚',lat:53.6127,lng:11.4247},{name:'勃兰登堡',lat:52.3906,lng:13.0645},
  {name:'萨克森-安哈尔特',lat:52.1205,lng:11.6276},{name:'图林根',lat:50.9848,lng:11.0299},
  {name:'不莱梅',lat:53.0793,lng:8.8017},{name:'萨尔兰',lat:49.2401,lng:6.9969}
];

germanyStates.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '德国', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 意大利大区
const italyRegions = [
  {name:'伦巴第',lat:45.4642,lng:9.1900},{name:'拉齐奥',lat:41.9028,lng:12.4964},
  {name:'坎帕尼亚',lat:40.8518,lng:14.2681},{name:'西西里',lat:38.1157,lng:13.3613},
  {name:'威尼托',lat:45.4408,lng:12.3155},{name:'艾米利亚-罗马涅',lat:44.4949,lng:11.3426},
  {name:'托斯卡纳',lat:43.7696,lng:11.2558},{name:'皮埃蒙特',lat:45.0703,lng:7.6869},
  {name:'普利亚',lat:41.1255,lng:16.8719},{name:'卡拉布里亚',lat:38.9107,lng:16.5946},
  {name:'撒丁',lat:39.2238,lng:9.1217},{name:'利古里亚',lat:44.4056,lng:8.9463}
];

italyRegions.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '意大利', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 西班牙自治区
const spainRegions = [
  {name:'马德里',lat:40.4168,lng:-3.7038},{name:'加泰罗尼亚',lat:41.3851,lng:2.1734},
  {name:'安达卢西亚',lat:37.3891,lng:-5.9845},{name:'瓦伦西亚',lat:39.4699,lng:-0.3763},
  {name:'加利西亚',lat:42.8805,lng:-8.5457},{name:'巴斯克',lat:43.2630,lng:-2.9350},
  {name:'卡斯蒂利亚-拉曼恰',lat:39.8628,lng:-4.0273},{name:'卡斯蒂利亚-莱昂',lat:41.6523,lng:-4.7245},
  {name:'阿拉贡',lat:41.6488,lng:-0.8891},{name:'埃斯特雷马杜拉',lat:38.9752,lng:-6.8736},
  {name:'阿斯图里亚斯',lat:43.3619,lng:-5.8594},{name:'穆尔西亚',lat:37.9922,lng:-1.1307},
  {name:'巴利阿里',lat:39.5696,lng:2.6502},{name:'加那利',lat:28.1235,lng:-15.4363}
];

spainRegions.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '西班牙', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 英国郡
const ukCounties = [
  {name:'大伦敦',lat:51.5074,lng:-0.1278},{name:'大曼彻斯特',lat:53.4808,lng:-2.2426},
  {name:'西米德兰兹',lat:52.4862,lng:-1.8904},{name:'默西赛德',lat:53.4084,lng:-2.9916},
  {name:'南约克郡',lat:53.3811,lng:-1.4701},{name:'泰恩-威尔',lat:54.9783,lng:-1.6178},
  {name:'西约克郡',lat:53.7960,lng:-1.5479},{name:'苏格兰',lat:55.9533,lng:-3.1883},
  {name:'威尔士',lat:51.4816,lng:-3.1791},{name:'北爱尔兰',lat:54.5973,lng:-5.9301}
];

ukCounties.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '英国', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 美国州（补充更多）
const usStates = [
  {name:'加利福尼亚',lat:36.7783,lng:-119.4179},{name:'德克萨斯',lat:31.9686,lng:-99.9018},
  {name:'佛罗里达',lat:27.6648,lng:-81.5158},{name:'纽约',lat:40.7128,lng:-74.0060},
  {name:'宾夕法尼亚',lat:41.2033,lng:-77.1945},{name:'伊利诺伊',lat:40.6331,lng:-89.3985},
  {name:'俄亥俄',lat:40.4173,lng:-82.9071},{name:'佐治亚',lat:32.1656,lng:-82.9001},
  {name:'北卡罗来纳',lat:35.7596,lng:-79.0193},{name:'密歇根',lat:44.3148,lng:-85.6024},
  {name:'新泽西',lat:40.0583,lng:-74.4057},{name:'弗吉尼亚',lat:37.4316,lng:-78.6569},
  {name:'华盛顿',lat:47.7511,lng:-120.7401},{name:'亚利桑那',lat:34.0489,lng:-111.0937},
  {name:'马萨诸塞',lat:42.4072,lng:-71.3824},{name:'田纳西',lat:35.5175,lng:-86.5804},
  {name:'印第安纳',lat:40.2672,lng:-86.1349},{name:'密苏里',lat:38.5767,lng:-92.1735},
  {name:'马里兰',lat:39.0458,lng:-76.6413},{name:'威斯康星',lat:44.2619,lng:-88.4154},
  {name:'科罗拉多',lat:39.5501,lng:-105.7821},{name:'明尼苏达',lat:46.7296,lng:-94.6859},
  {name:'南卡罗来纳',lat:33.8360,lng:-81.1637},{name:'阿拉巴马',lat:32.3182,lng:-86.9023},
  {name:'路易斯安那',lat:30.9843,lng:-91.9623},{name:'肯塔基',lat:37.8393,lng:-84.2700},
  {name:'俄勒冈',lat:43.8041,lng:-120.5542},{name:'俄克拉荷马',lat:35.4676,lng:-97.5164},
  {name:'康涅狄格',lat:41.6032,lng:-73.0877},{name:'犹他',lat:39.3210,lng:-111.0937},
  {name:'爱荷华',lat:41.8780,lng:-93.0977},{name:'内华达',lat:38.8026,lng:-116.4194},
  {name:'阿肯色',lat:35.2010,lng:-91.8318},{name:'密西西比',lat:32.3547,lng:-89.3985},
  {name:'堪萨斯',lat:39.0119,lng:-98.4842},{name:'新墨西哥',lat:34.5199,lng:-105.8701},
  {name:'内布拉斯加',lat:41.4925,lng:-99.9018},{name:'爱达荷',lat:44.0682,lng:-114.7420},
  {name:'西弗吉尼亚',lat:39.0000,lng:-80.5000},{name:'夏威夷',lat:19.8968,lng:-155.5828},
  {name:'新罕布什尔',lat:43.1939,lng:-71.5724},{name:'缅因',lat:45.2538,lng:-69.4455},
  {name:'蒙大拿',lat:46.8797,lng:-110.3626},{name:'罗德岛',lat:41.6809,lng:-71.5118},
  {name:'特拉华',lat:38.9108,lng:-75.5277},{name:'南达科他',lat:43.9695,lng:-99.9018},
  {name:'北达科他',lat:47.5515,lng:-101.0020},{name:'阿拉斯加',lat:64.2008,lng:-149.4937},
  {name:'佛蒙特',lat:44.5588,lng:-72.5805},{name:'怀俄明',lat:43.0760,lng:-107.2903}
];

usStates.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '美国', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 日本都道府县
const japanPrefectures = [
  {name:'东京',lat:35.6762,lng:139.6503},{name:'大阪',lat:34.6937,lng:135.5023},
  {name:'京都',lat:35.0116,lng:135.7681},{name:'北海道',lat:43.0642,lng:141.3469},
  {name:'神奈川',lat:35.4478,lng:139.6425},{name:'爱知',lat:35.1802,lng:136.9066},
  {name:'福冈',lat:33.6064,lng:130.4181},{name:'兵库',lat:34.6913,lng:135.1830},
  {name:'埼玉',lat:35.8570,lng:139.6489},{name:'千叶',lat:35.6074,lng:140.1065},
  {name:'广岛',lat:34.3853,lng:132.4553},{name:'宫城',lat:38.2682,lng:140.8694},
  {name:'新潟',lat:37.9026,lng:139.0232},{name:'静冈',lat:34.9769,lng:138.3831},
  {name:'冲绳',lat:26.2124,lng:127.6809},{name:'长野',lat:36.6513,lng:138.1810},
  {name:'岐阜',lat:35.3912,lng:136.7223},{name:'茨城',lat:36.0856,lng:140.2007},
  {name:'冈山',lat:34.6618,lng:133.9349},{name:'熊本',lat:32.7898,lng:130.7417},
  {name:'鹿儿岛',lat:31.5602,lng:130.5581},{name:'青森',lat:40.8244,lng:140.7400},
  {name:'岩手',lat:39.7036,lng:141.1527},{name:'宫崎',lat:31.9077,lng:131.4202},
  {name:'秋田',lat:39.7186,lng:140.1024},{name:'山形',lat:38.2404,lng:140.3633},
  {name:'福岛',lat:37.7503,lng:140.4676},{name:'群马',lat:36.3911,lng:139.0608},
  {name:'栃木',lat:36.5658,lng:139.8836},{name:'山梨',lat:35.6638,lng:138.5683},
  {name:'富山',lat:36.6953,lng:137.1515},{name:'石川',lat:36.5944,lng:136.6256},
  {name:'福井',lat:36.0652,lng:136.2216},{name:'滋贺',lat:35.0045,lng:135.8686},
  {name:'奈良',lat:34.6851,lng:135.8049},{name:'和歌山',lat:34.2261,lng:135.1675},
  {name:'鸟取',lat:35.5039,lng:134.2384},{name:'岛根',lat:35.4723,lng:133.0505},
  {name:'山口',lat:34.1860,lng:131.4706},{name:'德岛',lat:34.0658,lng:134.5594},
  {name:'香川',lat:34.3401,lng:134.0434},{name:'爱媛',lat:33.8416,lng:132.7657},
  {name:'高知',lat:33.5597,lng:133.5311},{name:'佐贺',lat:33.2494,lng:130.2988},
  {name:'长崎',lat:32.7448,lng:129.8737},{name:'大分',lat:33.2382,lng:131.6126}
];

japanPrefectures.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '日本', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 韩国道/特别市
const koreaRegions = [
  {name:'首尔',lat:37.5665,lng:126.9780},{name:'釜山',lat:35.1796,lng:129.0756},
  {name:'大邱',lat:35.8714,lng:128.6014},{name:'仁川',lat:37.4563,lng:126.7052},
  {name:'光州',lat:35.1595,lng:126.8526},{name:'大田',lat:36.3504,lng:127.3845},
  {name:'蔚山',lat:35.5384,lng:129.3114},{name:'京畿',lat:37.4138,lng:127.5183},
  {name:'江原',lat:37.8813,lng:127.7298},{name:'忠清北',lat:36.8000,lng:127.7000},
  {name:'忠清南',lat:36.5184,lng:126.8000},{name:'全罗北',lat:35.8200,lng:127.1000},
  {name:'全罗南',lat:34.8160,lng:126.4630},{name:'庆尚北',lat:36.4900,lng:128.8800},
  {name:'庆尚南',lat:35.4606,lng:128.2132},{name:'济州',lat:33.4996,lng:126.5312}
];

koreaRegions.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '韩国', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 加拿大省
const canadaProvinces = [
  {name:'安大略',lat:51.2538,lng:-85.3232},{name:'魁北克',lat:52.9399,lng:-73.5491},
  {name:'不列颠哥伦比亚',lat:53.7267,lng:-127.6476},{name:'阿尔伯塔',lat:53.9333,lng:-116.5765},
  {name:'马尼托巴',lat:53.7609,lng:-98.8139},{name:'萨斯喀彻温',lat:52.9399,lng:-106.4509},
  {name:'新斯科舍',lat:44.6820,lng:-63.7443},{name:'新不伦瑞克',lat:46.5653,lng:-66.4619},
  {name:'纽芬兰与拉布拉多',lat:53.1355,lng:-57.6604},{name:'爱德华王子岛',lat:46.5107,lng:-63.4168}
];

canadaProvinces.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '加拿大', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 澳大利亚州
const australiaStates = [
  {name:'新南威尔士',lat:-33.8688,lng:151.2093},{name:'维多利亚',lat:-37.8136,lng:144.9631},
  {name:'昆士兰',lat:-27.4698,lng:153.0251},{name:'南澳大利亚',lat:-34.9285,lng:138.6007},
  {name:'西澳大利亚',lat:-31.9505,lng:115.8605},{name:'塔斯马尼亚',lat:-42.8821,lng:147.3272},
  {name:'北领地',lat:-12.4634,lng:130.8456},{name:'首都领地',lat:-35.2809,lng:149.1300}
];

australiaStates.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '澳大利亚', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 巴西州
const brazilStates = [
  {name:'圣保罗',lat:-23.5505,lng:-46.6333},{name:'里约热内卢',lat:-22.9068,lng:-43.1729},
  {name:'米纳斯吉拉斯',lat:-19.9167,lng:-43.9345},{name:'巴伊亚',lat:-12.9714,lng:-38.5124},
  {name:'南里奥格兰德',lat:-30.0346,lng:-51.2177},{name:'巴拉那',lat:-25.4284,lng:-49.2733},
  {name:'伯南布哥',lat:-8.0476,lng:-34.8770},{name:'塞阿拉',lat:-3.7172,lng:-38.5433},
  {name:'帕拉',lat:-1.4558,lng:-48.5044},{name:'马拉尼昂',lat:-2.5387,lng:-44.2825},
  {name:'戈亚斯',lat:-16.6869,lng:-49.2648},{name:'亚马逊',lat:-3.1190,lng:-60.0217},
  {name:'圣卡塔琳娜',lat:-27.5954,lng:-48.5480},{name:'马托格罗索',lat:-15.6014,lng:-56.0979},
  {name:'南马托格罗索',lat:-20.4428,lng:-54.6464},{name:'帕拉伊巴',lat:-7.1195,lng:-34.8450},
  {name:'阿拉戈斯',lat:-9.6658,lng:-35.7353},{name:'皮奥伊',lat:-5.0892,lng:-42.8016},
  {name:'北里奥格兰德',lat:-5.7945,lng:-35.2110},{name:'圣埃斯皮里图',lat:-20.3155,lng:-40.3128},
  {name:'阿克里',lat:-9.9747,lng:-67.8243},{name:'阿马帕',lat:0.0389,lng:-51.0664},
  {name:'朗多尼亚',lat:-8.7612,lng:-63.9004},{name:'罗赖马',lat:2.8235,lng:-60.6758},
  {name:'托坎廷斯',lat:-10.1753,lng:-48.2982},{name:'塞尔希培',lat:-10.9472,lng:-37.0731},
  {name:'联邦区',lat:-15.7939,lng:-47.8828}
];

brazilStates.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '巴西', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 印度邦
const indiaStates = [
  {name:'马哈拉施特拉',lat:19.7515,lng:75.7139},{name:'北方邦',lat:26.8467,lng:80.9462},
  {name:'比哈尔',lat:25.0961,lng:85.3131},{name:'西孟加拉',lat:22.9868,lng:87.8550},
  {name:'泰米尔纳德',lat:11.1271,lng:78.6569},{name:'拉贾斯坦',lat:26.9124,lng:75.7873},
  {name:'卡纳塔克',lat:15.3173,lng:75.7139},{name:'古吉拉特',lat:22.2587,lng:71.1924},
  {name:'安得拉',lat:15.9129,lng:79.7400},{name:'奥里萨',lat:20.9517,lng:85.0985},
  {name:'特伦甘纳',lat:18.1124,lng:79.0193},{name:'喀拉拉',lat:10.8505,lng:76.2711},
  {name:'贾坎德',lat:23.6102,lng:85.2799},{name:'阿萨姆',lat:26.2006,lng:92.9376},
  {name:'旁遮普',lat:30.7333,lng:76.7794},{name:'恰蒂斯加尔',lat:21.2787,lng:81.8661},
  {name:'哈里亚纳',lat:28.4595,lng:77.0266},{name:'德里',lat:28.7041,lng:77.1025},
  {name:'查谟和克什米尔',lat:33.7782,lng:76.5762},{name:'北阿坎德',lat:30.0668,lng:79.0193},
  {name:'喜马偕尔',lat:31.1048,lng:77.1734},{name:'特里普拉',lat:23.9408,lng:91.9882},
  {name:'梅加拉亚',lat:25.4670,lng:91.3662},{name:'曼尼普尔',lat:24.6637,lng:93.9063},
  {name:'那加兰',lat:26.1584,lng:94.5624},{name:'果阿',lat:15.2993,lng:74.1240},
  {name:'阿鲁纳恰尔',lat:28.2180,lng:94.7278},{name:'米佐拉姆',lat:23.1645,lng:92.9376},
  {name:'锡金',lat:27.5330,lng:88.5122}
];

indiaStates.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '印度', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 墨西哥州
const mexicoStates = [
  {name:'墨西哥城',lat:19.4326,lng:-99.1332},{name:'哈利斯科',lat:20.6597,lng:-103.3496},
  {name:'新莱昂',lat:25.6866,lng:-100.3161},{name:'普埃布拉',lat:19.0414,lng:-98.2063},
  {name:'瓜纳华托',lat:21.0190,lng:-101.2574},{name:'奇瓦瓦',lat:28.6353,lng:-106.0889},
  {name:'韦拉克鲁斯',lat:19.1738,lng:-96.1342},{name:'米却肯',lat:19.5665,lng:-101.7068},
  {name:'瓦哈卡',lat:17.0594,lng:-96.7156},{name:'格雷罗',lat:17.4510,lng:-99.5440},
  {name:'索诺拉',lat:29.2972,lng:-110.3281},{name:'科阿韦拉',lat:27.0587,lng:-101.7068},
  {name:'下加利福尼亚',lat:30.8406,lng:-115.2838},{name:'锡那罗亚',lat:24.8091,lng:-107.3940},
  {name:'塔毛利帕斯',lat:23.7360,lng:-99.1411},{name:'伊达尔戈',lat:20.0917,lng:-98.7624},
  {name:'莫雷洛斯',lat:18.6813,lng:-99.1013},{name:'塔巴斯科',lat:17.8409,lng:-92.6189},
  {name:'恰帕斯',lat:16.7569,lng:-93.1292},{name:'尤卡坦',lat:20.7099,lng:-89.0943},
  {name:'金塔纳罗奥',lat:19.1817,lng:-88.4791},{name:'坎佩切',lat:19.8301,lng:-90.5349},
  {name:'阿瓜斯卡连特斯',lat:21.8853,lng:-102.2916},{name:'圣路易斯波托西',lat:22.1565,lng:-100.9855},
  {name:'萨卡特卡斯',lat:22.7709,lng:-102.5832},{name:'杜兰戈',lat:24.0277,lng:-104.6532},
  {name:'纳亚里特',lat:21.7514,lng:-104.8455},{name:'科利马',lat:19.2452,lng:-103.7241},
  {name:'特拉斯卡拉',lat:19.3139,lng:-98.2404},{name:'克雷塔罗',lat:20.5888,lng:-100.3899},
  {name:'墨西哥州',lat:19.4969,lng:-99.7233}
];

mexicoStates.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '墨西哥', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 印度尼西亚省
const indonesiaProvinces = [
  {name:'雅加达',lat:-6.2088,lng:106.8456},{name:'西爪哇',lat:-6.9175,lng:107.6191},
  {name:'中爪哇',lat:-7.1510,lng:110.4203},{name:'东爪哇',lat:-7.2575,lng:112.7521},
  {name:'巴厘',lat:-8.3405,lng:115.0920},{name:'北苏门答腊',lat:3.5952,lng:98.6722},
  {name:'西苏门答腊',lat:-0.9471,lng:100.4172},{name:'南苏门答腊',lat:-2.9761,lng:104.7754},
  {name:'南苏拉威西',lat:-5.1477,lng:119.4327},{name:'东加里曼丹',lat:-0.5020,lng:117.1536},
  {name:'巴布亚',lat:-4.2699,lng:138.0804},{name:'亚齐',lat:5.5483,lng:95.3238},
  {name:'廖内',lat:0.5071,lng:101.4478},{name:'占碑',lat:-1.6101,lng:103.6131},
  {name:'楠榜',lat:-5.4292,lng:105.2610},{name:'万丹',lat:-6.4058,lng:106.0640},
  {name:'中加里曼丹',lat:-1.6815,lng:113.3824},{name:'西加里曼丹',lat:-0.2788,lng:111.4753},
  {name:'北苏拉威西',lat:1.4748,lng:124.8421},{name:'中苏拉威西',lat:-1.4300,lng:121.4456}
];

indonesiaProvinces.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '印度尼西亚', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 阿根廷省
const argentinaProvinces = [
  {name:'布宜诺斯艾利斯',lat:-34.6037,lng:-58.3816},{name:'科尔多瓦',lat:-31.4201,lng:-64.1888},
  {name:'圣菲',lat:-31.6333,lng:-60.7000},{name:'门多萨',lat:-32.8895,lng:-68.8458},
  {name:'图库曼',lat:-26.8083,lng:-65.2176},{name:'恩特雷里奥斯',lat:-31.7320,lng:-60.5290},
  {name:'萨尔塔',lat:-24.7859,lng:-65.4117},{name:'米西奥内斯',lat:-27.3671,lng:-55.8961},
  {name:'查科',lat:-27.4000,lng:-58.7833},{name:'圣胡安',lat:-31.5375,lng:-68.5364},
  {name:'圣路易斯',lat:-33.3019,lng:-66.3369},{name:'卡塔马卡',lat:-28.4640,lng:-65.7853},
  {name:'拉里奥哈',lat:-29.4134,lng:-66.8564},{name:'圣地亚哥-德尔埃斯特罗',lat:-27.7833,lng:-64.2667},
  {name:'科连特斯',lat:-27.4833,lng:-58.8167},{name:'福尔摩沙',lat:-26.1895,lng:-58.1727},
  {name:'丘布特',lat:-43.3999,lng:-65.1284},{name:'内乌肯',lat:-38.9456,lng:-68.0698},
  {name:'拉潘帕',lat:-36.6167,lng:-64.2833},{name:'圣克鲁斯',lat:-51.6333,lng:-69.2500},
  {name:'火地岛',lat:-54.8000,lng:-68.3000}
];

argentinaProvinces.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '阿根廷', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 波兰省
const polandVoivodeships = [
  {name:'马佐夫舍',lat:52.2297,lng:21.0122},{name:'小波兰',lat:50.0647,lng:19.9450},
  {name:'西里西亚',lat:50.2600,lng:19.0238},{name:'下西里西亚',lat:51.1077,lng:17.0383},
  {name:'大波兰',lat:52.4064,lng:16.9299},{name:'波美拉尼亚',lat:54.4594,lng:18.5622},
  {name:'罗兹',lat:51.7704,lng:19.4738},{name:'圣十字',lat:50.7970,lng:20.8532},
  {name:'卢布林',lat:51.2476,lng:22.5727},{name:'库亚维-波美拉尼亚',lat:53.1235,lng:18.0077},
  {name:'瓦尔米亚-马祖里',lat:53.7793,lng:20.4992},{name:'奥波莱',lat:50.6924,lng:17.9515},
  {name:'西波美拉尼亚',lat:53.4285,lng:14.5528},{name:'滨海',lat:54.1723,lng:16.1847},
  {name:'卢布斯卡',lat:52.2920,lng:15.2545},{name:'圣十字',lat:50.7970,lng:20.8532},
  {name:'喀尔巴阡',lat:49.8224,lng:22.5375},{name:'奥尔什丁',lat:53.7793,lng:20.4992}
];

polandVoivodeships.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '波兰', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 乌克兰州
const ukraineOblasts = [
  {name:'基辅',lat:50.4501,lng:30.5234},{name:'敖德萨',lat:46.4825,lng:30.7233},
  {name:'顿涅茨克',lat:48.0097,lng:37.8033},{name:'第聂伯罗彼得罗夫斯克',lat:48.4647,lng:35.0462},
  {name:'哈尔科夫',lat:49.9935,lng:36.2304},{name:'利沃夫',lat:49.8397,lng:24.0297},
  {name:'文尼察',lat:49.2331,lng:28.4682},{name:'沃伦',lat:50.7472,lng:25.3259},
  {name:'外喀尔巴阡',lat:48.6208,lng:22.2969},{name:'苏梅州',lat:50.9077,lng:34.8005},
  {name:'切尔尼戈夫',lat:51.4982,lng:31.2846},{name:'切尔卡瑟',lat:49.4444,lng:32.0598},
  {name:'波尔塔瓦',lat:49.5883,lng:34.5514},{name:'基洛夫格勒',lat:48.5079,lng:32.2597},
  {name:'尼古拉耶夫',lat:46.9750,lng:32.0010},{name:'赫尔松',lat:46.6352,lng:32.6169},
  {name:'扎波罗热',lat:47.8388,lng:35.1396},{name:'卢甘斯克',lat:48.5740,lng:39.3078},
  {name:'伊万诺-弗兰科夫斯克',lat:48.9226,lng:24.7106},{name:'捷尔诺波尔',lat:49.5602,lng:25.5920},
  {name:'罗夫诺',lat:50.6196,lng:26.2515},{name:'赫梅利尼茨基',lat:49.4229,lng:26.9870},
  {name:'切尔诺夫策',lat:48.2914,lng:25.9351},{name:'苏梅州',lat:50.9077,lng:34.8005}
];

ukraineOblasts.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '乌克兰', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 土耳其省
const turkeyProvinces = [
  {name:'伊斯坦布尔',lat:41.0082,lng:28.9784},{name:'安卡拉',lat:39.9334,lng:32.8597},
  {name:'伊兹密尔',lat:38.4189,lng:27.1287},{name:'布尔萨',lat:40.1826,lng:29.0665},
  {name:'阿达纳',lat:37.0017,lng:35.3288},{name:'加济安泰普',lat:37.0662,lng:37.3765},
  {name:'科尼亚',lat:37.8720,lng:32.4844},{name:'梅尔辛',lat:36.8002,lng:34.6389},
  {name:'安塔利亚',lat:36.8550,lng:30.7173},{name:'科贾埃利',lat:40.8533,lng:29.8815},
  {name:'萨姆松',lat:41.2928,lng:36.3313},{name:'特拉布宗',lat:41.0053,lng:39.7167},
  {name:'埃尔祖鲁姆',lat:39.9091,lng:41.2703},{name:'迪亚巴克尔',lat:37.9100,lng:40.2400},
  {name:'尚勒乌尔法',lat:37.1591,lng:38.7969},{name:'马尼萨',lat:38.6191,lng:27.4289},
  {name:'艾登',lat:37.8560,lng:27.8478},{name:'穆拉',lat:37.2153,lng:28.3636},
  {name:'布尔杜尔',lat:37.7213,lng:30.1024},{name:'安塔利亚',lat:36.8550,lng:30.7173}
];

turkeyProvinces.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '土耳其', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 沙特阿拉伯省
const saudiProvinces = [
  {name:'利雅得',lat:24.7136,lng:46.6753},{name:'麦加',lat:21.4225,lng:39.8262},
  {name:'麦地那',lat:24.5247,lng:39.5692},{name:'东部省',lat:26.4344,lng:49.9787},
  {name:'卡西姆',lat:26.3033,lng:43.9736},{name:'阿西尔',lat:18.2578,lng:42.5024},
  {name:'塔布克',lat:28.3839,lng:36.5635},{name:'哈伊勒',lat:27.5213,lng:41.6955},
  {name:'麦地那',lat:24.5247,lng:39.5692},{name:'朱夫',lat:28.3839,lng:36.5635},
  {name:'纳季兰',lat:17.4934,lng:44.1220},{name:'巴哈',lat:20.0130,lng:41.4662},
  {name:'焦夫',lat:28.3839,lng:36.5635},{name:'利雅得',lat:24.7136,lng:46.6753}
];

saudiProvinces.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '沙特阿拉伯', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 伊朗省
const iranProvinces = [
  {name:'德黑兰',lat:35.6892,lng:51.3890},{name:'伊斯法罕',lat:32.6527,lng:51.6746},
  {name:'法尔斯',lat:29.5945,lng:52.5906},{name:'呼罗珊拉扎维',lat:36.2350,lng:59.5826},
  {name:'胡齐斯坦',lat:31.4360,lng:48.6736},{name:'西阿塞拜疆',lat:37.4550,lng:45.0000},
  {name:'东阿塞拜疆',lat:37.9036,lng:46.2399},{name:'库尔德斯坦',lat:35.9592,lng:46.9375},
  {name:'克尔曼',lat:29.4852,lng:57.6491},{name:'伊拉姆',lat:33.3841,lng:46.3928},
  {name:'布什尔',lat:28.9234,lng:50.8203},{name:'赞詹',lat:36.6650,lng:48.4686},
  {name:'马赞德兰',lat:36.2262,lng:52.5316},{name:'吉兰',lat:37.2809,lng:49.5924},
  {name:'阿尔达比勒',lat:38.2566,lng:48.2956},{name:'哈马丹',lat:34.7985,lng:48.5146},
  {name:'中央省',lat:35.6961,lng:50.9106},{name:'马尔卡兹',lat:35.6961,lng:50.9106}
];

iranProvinces.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '伊朗', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 埃及省
const egyptGovernorates = [
  {name:'开罗',lat:30.0444,lng:31.2357},{name:'亚历山大',lat:31.2001,lng:29.9187},
  {name:'吉萨',lat:30.0131,lng:31.2089},{name:'卢克索',lat:25.6988,lng:32.6420},
  {name:'阿斯旺',lat:24.0889,lng:32.8997},{name:'红海',lat:25.1178,lng:33.7960},
  {name:'新河谷',lat:25.0000,lng:30.5000},{name:'马特鲁',lat:31.3539,lng:27.2373},
  {name:'北西奈',lat:30.2833,lng:33.6176},{name:'南西奈',lat:28.5000,lng:33.9000},
  {name:'港口赛义德',lat:31.2653,lng:32.2758},{name:'苏伊士',lat:29.9668,lng:32.5498},
  {name:'伊斯梅利亚',lat:30.5833,lng:32.2667},{name:'卡夫拉谢赫',lat:31.1333,lng:30.9000},
  {name:'杜姆亚特',lat:31.4167,lng:31.8333},{name:' Dakahlia',lat:31.0333,lng:31.8333},
  {name:'Sharqia',lat:30.5833,lng:31.5000},{name:'Qalyubia',lat:30.4500,lng:31.2333},
  {name:'Beni Suef',lat:29.0667,lng:31.0833},{name:'Faiyum',lat:29.3000,lng:30.8333}
];

egyptGovernorates.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '埃及', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 尼日利亚州
const nigeriaStates = [
  {name:'拉各斯',lat:6.5244,lng:3.3792},{name:'卡诺',lat:12.0022,lng:8.5920},
  {name:'阿布贾',lat:9.0765,lng:7.3986},{name:'河流州',lat:4.7719,lng:6.9833},
  {name:'奥约',lat:7.3775,lng:3.9470},{name:'卡杜纳',lat:10.5222,lng:7.4383},
  {name:'包奇',lat:10.3158,lng:9.8442},{name:'博尔诺',lat:11.8333,lng:13.1500},
  {name:'科吉',lat:7.7333,lng:6.7333},{name:'克罗斯河',lat:4.9517,lng:8.3417},
  {name:'三角洲',lat:5.8333,lng:5.9167},{name:'埃多',lat:6.3333,lng:5.6333},
  {name:'埃努古',lat:6.4403,lng:7.4944},{name:'伊莫',lat:5.4833,lng:7.0333},
  {name:'阿比亚',lat:5.1167,lng:7.5000},{name:'阿南布拉',lat:6.2167,lng:6.9500},
  {name:'贝努埃',lat:7.3333,lng:8.7500},{name:'纳萨拉瓦',lat:8.5333,lng:8.5000},
  {name:'高原',lat:9.2167,lng:9.5167},{name:'夸拉',lat:8.4833,lng:4.5333},
  {name:'奥贡',lat:7.1667,lng:3.3500},{name:'翁多',lat:7.2500,lng:5.2000},
  {name:'奥孙',lat:7.5667,lng:4.5167},{name:'埃基蒂',lat:7.7167,lng:5.3167},
  {name:'卡齐纳',lat:12.9908,lng:7.6017},{name:'索科托',lat:13.0622,lng:5.2333},
  {name:'扎姆法拉',lat:12.1667,lng:6.2500},{name:'凯比',lat:12.4167,lng:4.2500},
  {name:'约贝',lat:11.7500,lng:11.9667},{name:'阿达马瓦',lat:9.3265,lng:12.3984},
  {name:'塔拉巴',lat:7.9167,lng:11.0000},{name:'贡贝',lat:10.2833,lng:11.1667},
  {name:'巴耶尔萨',lat:4.7500,lng:5.7500},{name:'埃邦伊',lat:6.2500,lng:7.7500},
  {name:'阿夸伊博姆',lat:4.9167,lng:7.9667},{name:'吉加瓦',lat:12.2000,lng:9.5000}
];

nigeriaStates.forEach(p => {
  newFeatures.push({
    type: 'Feature',
    properties: { name: p.name, country: '尼日利亚', admin_level: '1' },
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
  });
});

// 移除旧的同名标注，然后添加新的
data.features = data.features.filter(f => !['中国', '美国', '日本', '法国', '德国', '意大利', '西班牙', '英国', '韩国', '加拿大', '澳大利亚', '巴西', '印度', '墨西哥', '印度尼西亚', '阿根廷', '波兰', '乌克兰', '土耳其', '沙特阿拉伯', '伊朗', '埃及', '尼日利亚'].includes(f.properties.country));

// 添加新的特征
data.features = data.features.concat(newFeatures);

// 写入更新后的数据
fs.writeFileSync('./world_admin1_labels.json', JSON.stringify(data, null, 2));
console.log('更新完成，新的特征数量:', data.features.length);