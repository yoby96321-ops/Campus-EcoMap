'use strict';
const features = { power: '插座', air: '冷氣', wifi: 'Wi-Fi', drink: '飲料', seats: '座位' };
const modes = {
  walk:['步行',0,'walking'],
  bike:['單車',0,'bicycling'],
  scooter:['機車',0.09,'two-wheeler'],
  car:['汽車',0.20,'driving'],
  transit:['大眾運輸',null,'transit']
};
const restaurants = [
  { id:'fried', name:'一中豪大雞排', kind:'炸物', art:'fried', source:'https://yizhong.taiwan-hong.com/store_detail.php?id=5', sourceName:'一中商圈店家頁', note:'商圈資料列有雞排及其他炸物。' },
  { id:'ice', name:'一中豐仁冰', kind:'冰品', art:'ice', source:'https://travel.taichung.gov.tw/zh-tw/Shop/Consume/2495/', sourceName:'臺中市觀光旅遊網', address:'臺中市北區育才街3巷4號之6', note:'市府旅遊網介紹酸梅冰與牛奶冰淇淋。' },
  { id:'half', name:'盧の堡 半月燒餡餅一中直營店', kind:'餡餅', art:'fried' },
  { id:'mung', name:'豐味綠豆沙牛乳專門店一中支店', kind:'飲品', art:'drink', source:'https://travel.taichung.gov.tw/zh-tw/experience/gourmet-guide', sourceName:'臺中市觀光旅遊網', note:'市府美食指南收錄的一中飲品店。', amenities:{drink:true} },
  { id:'tea', name:'阿月紅茶冰', kind:'飲品', art:'drink', amenities:{drink:true} },
  { id:'bean', name:'統元豆花', kind:'甜點', art:'ice' }
];
const directorySources = {
  district: ['https://yizhong.taiwan-hong.com/contact.php', '一中商圈店家名單'],
  mall: ['https://www.chungyo.com.tw/floor', '中友百貨樓層導覽']
};
const menuResearchNotes = {
  'Hello早餐店':'依一中商圈店名搜尋位置。',
  'Morni 莫尼早餐一中店':'菜單與座位參考五權路舊址資料。食記標示已搬遷，前往前請核對新址。'
};
const categoryArt = {
  '早餐':'category-breakfast', '飲品':'category-tea', '甜點':'category-dessert',
  '咖啡與輕食':'category-cafe', '麵食':'category-noodles', '鍋物':'category-hotpot',
  '飯類':'category-rice', '小吃':'category-snack'
};
const seatSources = {
  '樂丘廚房':'https://cutecat8110.github.io/leo-chiu/',
  '海底撈火鍋 中友店':'https://dining.inline.app/zh-tw/region/tw/taichung/hot-pot/'
};
const directoryEntries = [
  ["三喜蛋餅", "早餐"],
  ["一心古早味蛋餅", "早餐"],
  ["OT蛋餅", "早餐"],
  ["一中大本營", "早餐"],
  ["一中街打餅舖烙餅", "早餐"],
  ["Morni 莫尼早餐一中店", "早餐"],
  ["朝氣美濃商行", "早餐"],
  ["晨家", "早餐"],
  ["Hello早餐店", "早餐"],
  ["阿如早餐店", "早餐"],
  ["輕時代飲品製造所", "飲品"],
  ["再睡5分鐘", "飲品"],
  ["多多茶坊", "飲品"],
  ["金色魔法紅茶", "飲品"],
  ["阿里山鐵道紅茶冰", "飲品"],
  ["山裏山外", "飲品"],
  ["Q弟紅豆餅一中店", "甜點"],
  ["地芋添糖&包心粉圓專賣", "甜點"],
  ["王子神谷日式厚鬆餅", "甜點"],
  ["老窗白糖粿", "甜點"],
  ["第一名地瓜球", "甜點"],
  ["樂丘廚房", "咖啡與輕食"],
  ["艾德咖啡", "咖啡與輕食"],
  ["和記傻瓜麵", "麵食"],
  ["王印製麵", "麵食"],
  ["九州拉麵", "麵食"],
  ["好吃河粉", "麵食"],
  ["好犀利麻辣燙 愛廣場店", "鍋物"],
  ["泰丘鍋物", "鍋物"],
  ["那個鍋", "鍋物"],
  ["全方位自助餐", "飯類"],
  ["古早味便當", "飯類"],
  ["阿六飯筒", "飯類"],
  ["健美先生-激炸滷味", "小吃"],
  ["求求辣年糕", "小吃"],
  ["日船章魚燒", "小吃"],
  ["品香滷味燙", "小吃"],
  ["微滷", "小吃"],
  ["日嚐拉麵館", "麵食", "district"],
  ["日日利海盜飯糰", "早餐", "district"],
  ["桐生日式可麗餅", "甜點", "district"],
  ["滷王滷味", "小吃", "district"],
  ["JT燉飯", "飯類", "district"],
  ["海底撈火鍋 中友店", "鍋物", "mall", "臺中市北區三民路三段161號", "中友百貨 14F"]
];
restaurants.push(...directoryEntries.map(([name, kind, key, address, location]) => {
  const [source, sourceName] = directorySources[key] ?? [];
  return {
    id: 'directory-' + name.normalize('NFC'), name, kind, address, art: categoryArt[kind],
    amenities: seatSources[name] ? {seats:true} : undefined,
    seatSource: seatSources[name],
    location: location ?? '三民校區周邊',
    source, sourceName,
    note: menuResearchNotes[name] ?? (sourceName ? '收錄自' + sourceName + '。出發前請確認門市地址與當日營業狀態。' : undefined)
  };
}));
// Category budgets are planning assumptions, not individual shop menus.
const budgetByKind = {
  '早餐':'40–110', '飲品':'35–90', '甜點':'45–150', '冰品':'45–120',
  '咖啡與輕食':'100–300', '麵食':'75–200', '鍋物':'180–420',
  '飯類':'75–200', '小吃':'40–130', '炸物':'60–130', '餡餅':'45–110'
};
const storeReferences = {
  '泰丘鍋物': {
    address:'臺中市北區一中街98號2樓',
    price:'鍋物 NT$238 起（店家公開價）',
    priceSource:'https://page.line.me/230xuydq',
    amenities:{power:true,wifi:true,seats:true},
    seatSource:'https://page.line.me/230xuydq'
  },
  '桐生日式可麗餅': {
    address:'臺中市北區一中街179巷1號',
    price:'平台列有 NT$60、80、190 品項（外送參考）',
    priceSource:'https://www.foodpanda.com.tw/restaurant/z1ix/tong-sheng-ri-shi-ke-li-bing'
  },
  '日日利海盜飯糰': {
    address:'臺中市北區三民路三段136-6號',
    price:'辣腸飯糰 NT$90（2024 報導參考）',
    priceSource:'https://www.youtube.com/watch?v=rFrvkUtZ-zU'
  },
  '海底撈火鍋 中友店': {
    budget:'NT$600–1,000／人（多人共鍋預算示意）',
    priceSource:'https://inline.app/order/-LamXb5SAQN7JcJfyRKi%3Ainline-live-2a466/-LfvyxgdSElc1INrAwIM?language=zh-tw'
  }
};
for (const shop of restaurants) {
  Object.assign(shop,storeReferences[shop.name]);
  shop.budget ??= 'NT$' + budgetByKind[shop.kind] + '（同類餐點預算示意）';
}

const facilityResearch = {
  '金色魔法紅茶': {evidence:{
    seats:[false,'https://travel.yam.com/article/139169','一中門市報導記載僅外帶，無內用空間']
  }},
  '山裏山外': {evidence:{
    seats:[true,'https://travel.yam.com/article/128321','一訪食記記載內用及靠窗座位'],
    air:[true,'https://travel.yam.com/article/128321','食記記載內用有冷氣']
  }},
  '晨家': {evidence:{
    seats:[true,'https://blog.footinder.app/%E5%8F%B0%E4%B8%AD%E5%B8%82%E5%8C%97%E5%8D%80-2/%E5%8F%B0%E4%B8%AD%E5%B8%82-%E5%8C%97%E5%8D%80-%E6%99%A8%E5%AE%B6%E6%97%A9%E5%8D%88%E9%A4%90mornhome-%E4%B8%80%E4%B8%AD%E5%BA%97/','一中門市食記記載兩側有座位']
  }},
  '朝氣美濃商行': {evidence:{
    seats:[true,'https://feliz.tw/mino/','五權店食記記載一、二樓皆有座位']
  }},
  '全方位自助餐': {evidence:{
    seats:[true,'https://taiwan17go.com/fangwei/','食記記載內用'],
    drink:[true,'https://taiwan17go.com/fangwei/','食記記載內用提供飲料']
  }},
  '微滷': {evidence:{
    seats:[true,'https://taiwan17go.com/wq603/','食記記載店內座位有限']
  }},
  '和記傻瓜麵': {evidence:{
    seats:[true,'https://orange-dog.com/simplemen/','太平路門市食記記載室內外座位'],
    air:[true,'https://orange-dog.com/simplemen/','食記記載室內有冷氣，現況以店家為準']
  }},
  '好吃河粉': {evidence:{
    seats:[true,'https://shin.tw/goodeat-pho/','食記記載內外皆有桌位'],
    drink:[true,'https://shin.tw/goodeat-pho/','菜單報導列有泰式奶茶及奶綠']
  }},
  '求求辣年糕': {evidence:{
    seats:[true,'https://evavin.com/shop/qiuqiu-tteokbokki-yizhong','報導記載現場候位與內用']
  }},
  '阿如早餐店': {evidence:{
    seats:[true,'https://candylife.tw/arubrunch/','門市食記記載內用桌位']
  }},


  '統元豆花': {capacity:20, capacityNote:'公開食記約 20 席（含室內與室外，2022）', evidence:{
    seats:[true,'https://ifoodie.tw/post/633b990fb4478b72345faf39-%E5%8F%B0%E4%B8%AD%E7%BE%8E%E9%A3%9F%E3%80%90%E7%B5%B1%E5%85%83%E8%B1%86%E8%8A%B1%E3%80%91%EF%BD%9C%E4%B8%80%E4%B8%AD%E8%A1%9750%E5%B9%B4%E8%80%81%E5%AD%97%E8%99%9F','食記記錄約 20 席'],
    drink:[true,'https://vocus.cc/article/68255b63fd89780001d5a4f2','一中門市食記列有飲品']
  }},
  '一中豐仁冰': {evidence:{
    seats:[true,'https://www.marieclaire.com.tw/lifestyle/taste/93717','座位區可用餐'],
    air:[false,'https://www.marieclaire.com.tw/lifestyle/taste/93717','座位區有遮雨棚，報導記載無冷氣']
  }},
  '泰丘鍋物': {evidence:{
    power:[true,'https://page.line.me/230xuydq','店家官方 LINE 註明可使用插座'],
    wifi:[true,'https://page.line.me/230xuydq','店家官方 LINE 註明免費 Wi-Fi'],
    drink:[true,'https://page.line.me/230xuydq','自助吧有泰式飲品'],
    seats:[true,'https://www.myfunnow.com/zh-tw/funbook/3037413681630/branch','接受內用訂位']
  }},
  '王印製麵': {evidence:{
    air:[false,'https://sunnylife.tw/wangin/','食記記載未設冷氣'],
    seats:[true,'https://supertaste.tvbs.com.tw/amp/food/319294','報導記載內用候位']
  }},
  'JT燉飯': {evidence:{
    seats:[true,'https://www.ftvnews.com.tw/news/detail/2023B06W0057','報導記載三層用餐空間']
  }},
  '九州拉麵': {evidence:{
    seats:[true,'https://pbecky77.pixnet.net/blog/posts/10296074099','舊食記記載一、二樓內用'],
    air:[true,'https://pbecky77.pixnet.net/blog/posts/10296074099','舊食記記載有冷氣，現況仍需確認']
  }},
  '樂丘廚房': {evidence:{
    seats:[true,'https://nivoselab.com/leochiu2/','一中門市食記記載內用座位'],
    wifi:[true,'https://millycat0616.pixnet.net/blog/posts/9460662584','舊食記記載提供 Wi-Fi，現況仍需確認']
  }}
};
for (const shop of restaurants) {
  const research = facilityResearch[shop.name];
  if (!research) continue;
  shop.facilityEvidence = research.evidence;
  shop.capacity = research.capacity;
  shop.capacityNote = research.capacityNote;
  shop.amenities = {...shop.amenities};
  for (const [key,[value]] of Object.entries(research.evidence)) shop.amenities[key] = value;
}

function emissions(km, factor) {
  if (!Number.isFinite(km) || km < 0 || !Number.isFinite(factor) || factor < 0) throw new RangeError('距離與係數必須是非負有限數值');
  return km * 2 * factor;
}
const walkingRoutes = {
  'directory-好犀利麻辣燙 愛廣場店': {address:'臺中市北區一中街96號',source:'https://i-plaza.com.tw/floor/好犀利麻辣燙-20.html',point:[24.149338,120.685251],pointSource:'臺中門牌 GIS',note:'算到愛廣場共用入口。',outMeters:126.3,backMeters:126.3},
  'directory-品香滷味燙': {address:'臺中市北區尊賢街38號',source:'https://www.iceo.com.tw/2024/03/blog-post_37.html',point:[24.1487414,120.6860641],pointSource:'臺中門牌 GIS',note:'採食記記載的尊賢街38號門牌。',outMeters:267.9,backMeters:267.9},
  "fried": {"address":"臺中市北區一中街49號","source":"https://www.taichung.io/yizhong/yz-006","point":[24.1489198,120.684778],"pointSource":"臺中門牌 GIS","note":"","outMeters":161.6,"backMeters":161.6},
  "ice": {"address":"臺中市北區育才街3巷4號之6","source":"https://travel.taichung.gov.tw/zh-tw/shop/consume/2495","point":[24.14896,120.686528],"pointSource":"公開地圖座標","note":"門市座標參考","outMeters":268.1,"backMeters":268.1},
  "half": {"address":"臺中市北區育才南街31號","source":"https://jp.taiwan.net.tw/att/travelCenter/3812.pdf","point":[24.1482107,120.6855471],"pointSource":"臺中門牌 GIS","note":"使用同門牌樓層在市府 GIS 的建物點位","outMeters":286.8,"backMeters":286.8},
  "mung": {"address":"臺中市北區太平路63巷1號","source":"https://www.taichung.io/yizhong/yz-014","point":[24.1475451,120.6843569],"pointSource":"公開地圖座標","note":"門市座標","outMeters":319.7,"backMeters":319.7},
  "tea": {"address":"臺中市北區一中街96號","source":"https://i-plaza.com.tw/floor/","point":[24.149338,120.685251],"pointSource":"臺中門牌 GIS","note":"愛廣場 1F 櫃位，算到商場門牌","outMeters":126.3,"backMeters":126.3},
  "bean": {"address":"臺中市北區育才北路42號","source":"https://merchantlist.i-pass.com.tw/list/index/A20250605143125?page=2189","point":[24.1523653,120.6868451],"pointSource":"臺中門牌 GIS","note":"","outMeters":507.6,"backMeters":507.6},
  "directory-三喜蛋餅": {"address":"臺中市東區東光路64號","source":"https://leonafunlife.com/3likeeggcake/","point":[24.1429182,120.6972965],"pointSource":"臺中門牌 GIS","note":"原一中商圈店搬遷，採東區新址","outMeters":2036.6,"backMeters":2036.6},
  "directory-一心古早味蛋餅": {"address":"臺中市北區錦中街90號","source":"https://www.fonfood.com/store/708042","point":[24.1556487,120.6878233],"pointSource":"臺中門牌 GIS","note":"攤位在 90 號對面，本筆以對側門牌近似","outMeters":843.4,"backMeters":843.4},
  "directory-OT蛋餅": {"address":"臺中市北區育才街35號之1","source":"https://www.fda.gov.tw/tc/includes/GetFile.ashx?id=f636694223255615088","point":[24.1495421,120.6846577],"pointSource":"臺中門牌 GIS","note":"早期稽查所載攤址，使用同門牌的樓層點位，現址仍需確認","outMeters":66.5,"backMeters":66.5},
  "directory-一中大本營": {"address":"臺中市北區三民路三段112號之1","source":"https://www.youtube.com/watch?v=B80Gl3tRJy8","point":[24.1497029,120.6842559],"pointSource":"臺中門牌 GIS","note":"","outMeters":19.6,"backMeters":19.6},
  "directory-一中街打餅舖烙餅": {"address":"臺中市北區一中街83號","source":"https://www.taichung.io/yizhong/yz-012","point":[24.1492995,120.6849292],"pointSource":"臺中門牌 GIS","note":"","outMeters":148.4,"backMeters":148.4},
  "directory-朝氣美濃商行": {"address":"臺中市北區五權路408號","source":"https://taiwan17go.com/mino/","point":[24.1529237,120.6821579],"pointSource":"臺中門牌 GIS","note":"","outMeters":639.8,"backMeters":639.8},
  "directory-晨家": {"address":"臺中市北區中華路二段131號","source":"https://www.bot.com.tw/Images/File/GetFileId/dd8db8d2-321d-47b2-913b-719c3761afcb","point":[24.149015,120.6804506],"pointSource":"臺中門牌 GIS","note":"","outMeters":505.7,"backMeters":505.7},
  "directory-阿如早餐店": {"address":"臺中市北區文祥街49號","source":"https://candylife.tw/arubrunch/","point":[24.150586,120.6806025],"pointSource":"臺中門牌 GIS","note":"","outMeters":669.7,"backMeters":669.7},
  "directory-輕時代飲品製造所": {"address":"臺中市北區一中街175號","source":"https://datagovtw.com/faden.php?id=B-200141096-00000-1","point":[24.1517738,120.6859765],"pointSource":"臺中門牌 GIS","note":"","outMeters":374.3,"backMeters":374.3},
  "directory-再睡5分鐘": {"address":"臺中市北區尊賢街7號","source":"https://maxfoodfun.com/napteazzz-taichung/","point":[24.1487604,120.6853224],"pointSource":"臺中門牌 GIS","note":"路網接點離門市座標約 36 公尺。","outMeters":242.4,"backMeters":242.4},
  "directory-多多茶坊": {"address":"臺中市北區尊賢街38號","source":"https://ac.nutc.edu.tw/var/file/77/1077/attach/37/pta_75943_2622204_93306.pdf","point":[24.1487414,120.6860641],"pointSource":"臺中門牌 GIS","note":"","outMeters":267.9,"backMeters":267.9},
  "directory-金色魔法紅茶": {"address":"臺中市北區太平路133號","source":"https://travel.taichung.gov.tw/content/files/High-quality-restaurants.pdf","point":[24.1484829,120.6824234],"pointSource":"臺中門牌 GIS","note":"","outMeters":319.1,"backMeters":319.1},
  "directory-阿里山鐵道紅茶冰": {"address":"臺中市北區三民路三段112號之1","source":"https://www.foodpanda.com.tw/restaurant/n3lk/shui-yun-cha-tang-a-li-shan-tie-dao-hong-cha-tai-zhong-san-min-dian/reviews","point":[24.1497029,120.6842559],"pointSource":"臺中門牌 GIS","note":"與另一筆有相同門牌來源，路網距離可能相同","outMeters":19.6,"backMeters":19.6},
  "directory-山裏山外": {"address":"臺中市北區篤行路214號","source":"https://www.fda.gov.tw/tc/includes/GetFile.ashx?id=f638702117983528375&type=4","point":[24.1516443,120.6737625],"pointSource":"臺中門牌 GIS","note":"","outMeters":1404.3,"backMeters":1404.3},
  "directory-Q弟紅豆餅一中店": {"address":"臺中市北區一中街96號","source":"https://supertaste.tvbs.com.tw/amp/food/319294","point":[24.149338,120.685251],"pointSource":"臺中門牌 GIS","note":"商場門牌","outMeters":126.3,"backMeters":126.3},
  "directory-地芋添糖&包心粉圓專賣": {"address":"臺中市北區錦新街28號之3","source":"https://catkissfood.com/%E3%80%90%E5%8F%B0%E4%B8%AD%E5%8C%97%E5%8D%80%E7%BE%8E%E9%A3%9F%E3%80%91%E5%9C%B0%E8%8A%8B%E6%B7%BB%E7%B3%96-%E9%9A%B1%E8%BA%AB%E4%B8%80%E4%B8%AD%E7%9B%8A%E6%B0%91%E5%95%86%E5%9C%88%EF%BC%8C/","point":[24.153111,120.6878207],"pointSource":"臺中門牌 GIS","note":"","outMeters":883.7,"backMeters":883.7},
  "directory-王子神谷日式厚鬆餅": {"address":"臺中市北區一中街6號","source":"https://www.youtube.com/watch?v=dqZ9LseJ5dU","point":[24.1465566,120.6840037],"pointSource":"臺中門牌 GIS","note":"","outMeters":437.2,"backMeters":437.2},
  "directory-老窗白糖粿": {"address":"臺中市北區育才南街20號","source":"https://www.youtube.com/watch?v=dqZ9LseJ5dU","point":[24.148268,120.6859917],"pointSource":"臺中門牌 GIS","note":"","outMeters":326.4,"backMeters":326.4},
  "directory-第一名地瓜球": {"address":"臺中市北區一中街22號","source":"https://lyes.tw/33455317-%E7%AC%AC%E4%B8%80%E5%90%8D%E5%9C%B0%E7%93%9C%E7%90%83/","point":[24.1470234,120.6841975],"pointSource":"臺中門牌 GIS","note":"","outMeters":379.4,"backMeters":379.4},
  "directory-樂丘廚房": {"address":"臺中市北區一中街96號","source":"https://gototravel.tw/taichung-leochiu-restaurant/","point":[24.149338,120.685251],"pointSource":"臺中門牌 GIS","note":"食記所載愛廣場 2F，算到商場門牌","outMeters":126.3,"backMeters":126.3},
  "directory-艾德咖啡": {"address":"臺中市北區太平路81號之1","source":"https://shin.tw/add-coffee/","point":[24.1479905,120.6838984],"pointSource":"臺中門牌 GIS","note":"","outMeters":289.4,"backMeters":289.4},
  "directory-和記傻瓜麵": {"address":"臺中市北區太平路119號","source":"https://taiwan17go.com/taipingroad/","point":[24.1483887,120.6826475],"pointSource":"臺中門牌 GIS","note":"","outMeters":262,"backMeters":262},
  "directory-王印製麵": {"address":"臺中市北區太平路65號之1","source":"https://supertaste.tvbs.com.tw/amp/food/319294","point":[24.1476204,120.6844015],"pointSource":"臺中門牌 GIS","note":"","outMeters":319.1,"backMeters":319.1},
  "directory-九州拉麵": {"address":"臺中市北區三民路三段120巷1號","source":"https://www.google.com/maps/dir/?api=1&origin=24.1513378%2C120.6824302&destination=24.1499902%2C120.6845123&travelmode=walking","point":[24.1499902,120.6845123],"pointSource":"公開地圖座標","note":"使用使用者提供的 Google Maps 門市點位","outMeters":76.8,"backMeters":76.8},
  "directory-好吃河粉": {"address":"臺中市北區太平路129號","source":"https://www.youtube.com/watch?v=zXsL1wb9ZL4","point":[24.1484589,120.6824854],"pointSource":"臺中門牌 GIS","note":"","outMeters":280.2,"backMeters":280.2},
  "directory-泰丘鍋物": {"address":"臺中市北區一中街98號","source":"https://page.line.me/230xuydq","point":[24.1492907,120.6854358],"pointSource":"臺中門牌 GIS","note":"門市在二樓，算到地面門牌","outMeters":151.2,"backMeters":151.2},
  "directory-那個鍋": {"address":"臺中市北區太平路21號","source":"https://footinder.com.tw/%E5%8F%B0%E4%B8%AD%E5%B8%82%E5%8C%97%E5%8D%80/137739/","point":[24.1474036,120.685397],"pointSource":"臺中門牌 GIS","note":"","outMeters":404.8,"backMeters":404.8},
  "directory-全方位自助餐": {"address":"臺中市北區育才街6巷3號之2","source":"https://taiwan17go.com/fangwei/","point":[24.1499069,120.684888],"pointSource":"臺中門牌 GIS","note":"","outMeters":117.2,"backMeters":117.2},
  "directory-古早味便當": {"address":"臺中市北區一中街86號","source":"https://niniandblue.com/blog/post/chenbox","point":[24.1491281,120.685079],"pointSource":"臺中門牌 GIS（相鄰點）","note":"攤位無獨立 GIS 點位，以同側一中街90號近似","outMeters":136.1,"backMeters":136.1},
  "directory-阿六飯筒": {"address":"臺中市北區太平路109號","source":"https://taiwan17go.com/taipingroad/","point":[24.1483722,120.6828769],"pointSource":"臺中門牌 GIS","note":"","outMeters":239.6,"backMeters":239.6},
  "directory-健美先生-激炸滷味": {"address":"臺中市北區三民路三段111號","source":"https://www.youtube.com/watch?v=F_IhT_esNQk","point":[24.1477517,120.6829802],"pointSource":"臺中門牌 GIS","note":"","outMeters":258.3,"backMeters":258.3},
  "directory-求求辣年糕": {"address":"臺中市北區三民路三段126巷4號","source":"https://tw.chickpt.com.tw/job-Dlk0lK4V85G2","point":[24.1502093,120.6848221],"pointSource":"臺中門牌 GIS","note":"","outMeters":126.3,"backMeters":126.3},
  "directory-日船章魚燒": {"address":"臺中市北區育才街27號之1","source":"https://www.taichung.io/yizhong/yz-021","point":[24.1492363,120.6848329],"pointSource":"公開地圖座標","note":"門市座標","outMeters":115.5,"backMeters":115.5},
  "directory-微滷": {"address":"臺中市北區三民路三段201巷18號","source":"https://ifoodie.tw/post/65aa1f07eb74c4810be76809","point":[24.153478,120.6849269],"pointSource":"臺中門牌 GIS","note":"","outMeters":508.8,"backMeters":508.8},
  "directory-日嚐拉麵館": {"address":"臺中市北區一中街96號","source":"https://i-plaza.com.tw/floor/","point":[24.149338,120.685251],"pointSource":"臺中門牌 GIS","note":"愛廣場 1F 櫃位，算到商場門牌","outMeters":126.3,"backMeters":126.3},
  "directory-日日利海盜飯糰": {"address":"臺中市北區三民路三段136號之6","source":"https://yizhong.taiwan-hong.com/store_detail.php?id=35","point":[24.1507362,120.6847923],"pointSource":"臺中門牌 GIS","note":"","outMeters":139.5,"backMeters":139.5},
  "directory-桐生日式可麗餅": {"address":"臺中市北區一中街179巷1號","source":"https://www.kiryucrepe.com/pages/7","point":[24.1519589,120.6860408],"pointSource":"公開地圖座標","note":"門市座標參考","outMeters":394.9,"backMeters":394.9},
  "directory-滷王滷味": {"address":"臺中市北區一中街83號之3","source":"https://yizhong.taiwan-hong.com/store_detail.php?id=46","point":[24.1492995,120.6849292],"pointSource":"臺中門牌 GIS（相鄰點）","note":"支號無獨立 GIS 點位，以同側一中街83號近似","outMeters":148.4,"backMeters":148.4},
  "directory-JT燉飯": {"address":"臺中市北區一中街97號","source":"https://www.taichung.io/yizhong/yz-036","point":[24.1501809,120.6853392],"pointSource":"公開地圖座標","note":"門市座標","outMeters":187.2,"backMeters":187.2},
  "directory-海底撈火鍋 中友店": {"address":"臺中市北區三民路三段161號","source":"https://www.chungyo.com.tw/floor","point":[24.1522,120.6847],"pointSource":"公開地圖座標","note":"中友百貨 14F，算到百貨建物點位","outMeters":482.8,"backMeters":482.8},
};
for (const shop of restaurants) {
  const walking = walkingRoutes[shop.id];
  if (walking) {
    shop.walking = walking;
    shop.address = walking.address;
  }
}
function roundTripDistance(shop) {
  if (shop.walking) return (shop.walking.outMeters+shop.walking.backMeters) / 1000;
  return null;
}
function selectRestaurants(list, query, selected, sorting) {
  const keyword = query.trim().toLocaleLowerCase();
  const matches = list.filter(({name,kind,amenities}) =>
    (name + ' ' + kind).toLocaleLowerCase().includes(keyword) &&
    selected.every(key => amenities?.[key] === true));
  return sorting === 'near' ? matches.sort((a,b) => (a.walking?.outMeters ?? Infinity) - (b.walking?.outMeters ?? Infinity)) : matches;
}
function mapEmbedUrl(restaurant, origin) {
  const url = new URL('https://www.google.com/maps');
  const destination = restaurant.name + ' ' + (restaurant.address ?? '臺中市北區 一中商圈');
  const query = {q:origin ? origin.join(',') : destination,z:'17'};
  url.search = new URLSearchParams({...query,output:'embed',hl:'zh-TW'});
  return url.href;
}
function googleDirectionsUrl(restaurant, mode, origin) {
  const destination = restaurant.name + ' ' + (restaurant.address ?? '臺中市北區 一中商圈');
  const campus = '國立臺中科技大學三民校區 臺中市北區三民路三段129號';
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({
    api:'1',origin:origin ? origin.join(',') : campus,destination,travelmode:modes[mode][2]
  });
  return url.href;
}
function googleDirectionsEmbedUrl(restaurant, mode, origin) {
  const {searchParams} = new URL(googleDirectionsUrl(restaurant,mode,origin));
  const url = new URL('https://www.google.com/maps');
  url.search = new URLSearchParams({
    saddr:searchParams.get('origin'),daddr:searchParams.get('destination'),
    dirflg:{walk:'w',bike:'b',scooter:'l',car:'d',transit:'r'}[mode],output:'embed',hl:'zh-TW'
  });
  return url.href;
}
const shopPoints = {
  '一中豐仁冰':[24.14896,120.686528],
  '豐味綠豆沙牛乳專門店一中支店':[24.14754,120.68437],
  '桐生日式可麗餅':[24.15196,120.68604],
  '海底撈火鍋 中友店':[24.15220,120.68470]
};
function straightDistance(from,to) {
  const radians = Math.PI / 180;
  const [a,b] = from.map(value => value * radians);
  const [c,d] = to.map(value => value * radians);
  const chord = Math.sin((c-a)/2)**2 + Math.cos(a)*Math.cos(c)*Math.sin((d-b)/2)**2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1,chord)));
}
// Menu names come from the linked listing. Recipe weights and energy are classroom models.
const storeMenus = {
  '一中豪大雞排': {source:'https://yizhong.taiwan-hong.com/store_detail.php?id=5', items:[['雞排','chicken'],['香酥魷魚','friedSquid'],['花枝丸','friedFishBalls']]},
  '一中豐仁冰': {source:'https://travel.taichung.gov.tw/zh-tw/shop/consume/2495', items:[['豐仁冰（酸梅冰沙）','ice'],['乾豐仁冰（平日限定）','dryIce','https://pbear.tw/一中豐仁冰/'],['酸梅冰','plumIce','https://pbear.tw/一中豐仁冰/']]},
  '豐味綠豆沙牛乳專門店一中支店': {source:'https://www.taichung.io/yizhong/yz-014', items:[['綠豆沙牛乳','milk'],["大甲芋泥鮮奶","taroMilk","https://lizzzstyle.tw/fengweilocaldrinks/"]]},
  '阿月紅茶冰': {source:'https://i-plaza.com.tw/floor/阿月紅茶-4.html', items:[['紅茶冰','tea'],['白玉珍珠鮮奶茶','doubleQMilkTea']]},
  '泰丘鍋物': {source:'https://page.line.me/230xuydq', items:[
    ['青焰綠咖哩鍋底','thaiGreen'],['皇家冬蔭鍋底','thaiTomYum'],['濃純豚骨牛奶鍋底','thaiMilk']
  ]},
  '桐生日式可麗餅': {source:'https://www.foodpanda.com.tw/restaurant/z1ix/tong-sheng-ri-shi-ke-li-bing', items:[
    ['香蕉巧克','bananaCrepe'],['黑胡椒牛肉','beefCrepe'],['精品拿鐵咖啡','coffee']
  ]},
  '王印製麵': {source:'https://supertaste.tvbs.com.tw/amp/food/319294', items:[['麻辣乾麵','spicyNoodles'],['牛肉湯麵','beefBrothNoodles','https://woman.udn.com/woman/story/123162/8569717']]},
  '日日利海盜飯糰': {source:'https://www.youtube.com/watch?v=rFrvkUtZ-zU', items:[['海盜辣腸飯糰','pirateRice'],['招牌海盜飯糰','plainPirateRice','https://cheer198.pixnet.net/blog/posts/2036743468']]},
  '日船章魚燒': {source:'https://www.yizhong.taiwan-hong.com/contact.php', items:[['章魚小丸子','snack'],['芥末海苔章魚小丸子','wasabiTakoyaki','https://www.foodpanda.com.tw/en/restaurant/hew1/ri-chuan-zhang-yu-xiao-wan-zi-tai-zhong-zhong-dian']]},
  '海底撈火鍋 中友店': {source:'https://inline.app/order/-LamXb5SAQN7JcJfyRKi%3Ainline-live-2a466/-LfvyxgdSElc1INrAwIM?language=zh-tw', items:[['撈麵','handPulledNoodles'],["撈派滑牛肉","slicedBeef","https://www.fonfood.com/store/2130080"],["梅花豬肉","slicedPork","https://www.fonfood.com/store/2130080"],["油條","friedDough","https://www.fonfood.com/store/2130080"]]},
  "盧の堡 半月燒餡餅一中直營店": {source:"https://travel.taichung.gov.tw/zh-tw/shop/consume/3702", items:[["玉米起司蛋半月燒",'halfCorn'],["半月燒牛肉餡餅","halfBeef","https://news.ustv.com.tw/food/shop/1165"],["半月燒豬肉餡餅","halfPork","https://news.ustv.com.tw/food/shop/1165"],["半月燒雞肉餡餅","halfChicken","https://news.ustv.com.tw/food/shop/1165"]]},
  "統元豆花": {source:"https://vocus.cc/article/68255b63fd89780001d5a4f2", items:[["綜合豆花",'soyPudding'],["花生豆花","peanutSoy","https://www.ubereats.com/tw/store/統元豆花-一中店/clD40z6VTyqq1OyL8weGQA"],["粉圓豆花","bobaSoy","https://www.ubereats.com/tw/store/統元豆花-一中店/clD40z6VTyqq1OyL8weGQA"]]},
  "一心古早味蛋餅": {source:"https://www.taichung.gov.tw/umbraco/Surface/GetFile/GetDownloadFileS?cid=2511222&fileLocation=%2Fmedia%2F1002322%2F00-s-%E5%96%AE-2023-%E6%BC%BE%E5%8F%B0%E4%B8%AD-no28-1201.pdf", items:[["起司蛋餅",'cheesePancake'],["原味蛋餅","pancake"]]},
  'Morni 莫尼早餐一中店': {source:'https://www.ubereats.com/tw/store/morni-莫尼早餐-台中一中店/XdIscju3Tse437rvD4q5vg', items:[['燻雞蛋餅','smokedChickenPancake'],['德式香腸蛋餅','sausagePancake'],['和風鍋燒意麵','hotPotNoodles']]},
  "多多茶坊": {source:"https://niniandblue.com/blog/post/183497877", items:[["小黑（金桔梅子綠茶）",'kumquatTea'],["多多綠","yogurtGreenTea","https://www.taichung.io/yizhong/yz-003"],["泡沫紅茶","tea","https://www.jamiemarble.com/blog/post/duoduo-tea"]]},
  "Q弟紅豆餅一中店": {source:"https://kenji.life/qd-redcake/", items:[["原味紅豆餅",'redBeanCake'],['傳統奶油','custardCake'],['花生麻糬','peanutCake']]},
  "地芋添糖&包心粉圓專賣": {source:"https://lyes.tw/32373238-%E5%9C%B0%E8%8A%8B%E6%B7%BB%E7%B3%96/", items:[["包心粉圓",'filledTapioca'],["桂花粉粿挫冰","jellyIce"]]},
  "老窗白糖粿": {source:"https://taiwan17go.com/retrowindow0830/", items:[["花生白糖粿",'sugarCake'],["紫地瓜白糖粿","purpleCake","https://2afoodie.com/retrowind0w/"],["抹茶白糖粿","matchaCake","https://2afoodie.com/retrowind0w/"]]},
  "第一名地瓜球": {source:"https://taiwan17go.com/qqball/", items:[["地瓜球（小份）",'sweetPotatoBalls'],["地瓜球（大份）","largeSweetPotatoBalls","https://huablog.tw/qqball/"]]},
  "樂丘廚房": {source:"https://nivoselab.com/leochiu2/", items:[["珍珠奶茶舒芙蕾鬆餅",'souffle'],["貝殼干貝明太子海鮮義大利麵","scallopPasta","https://havefunday.com/taiwan-foods/taichung-foods-54/"],["冰拿鐵咖啡","coffee","https://www.fonfood.com/store/6763655"]]},
  '九州拉麵': {source:'https://www.walkerland.com.tw/article/view/220330', items:[
    ['奶油拉麵','butterRamen'],['招牌拉麵','tonkotsu'],['味噌拉麵','misoRamen'],
    ['麻辣拉麵','spicyRamen'],['泡菜拉麵','kimchiRamen'],['鮑魚拉麵','abaloneRamen']
  ]},
  '好犀利麻辣燙 愛廣場店': {source:'https://i-plaza.com.tw/floor/好犀利麻辣燙-20.html',items:[['極品麻辣鴨血臭豆腐','duckBloodTofu']]},
  '品香滷味燙': {source:'https://tainanfoodeat.blogspot.com/2025/12/luwei-pinxiang.html',items:[['骨仔肉','braisedPork'],['青菜','braisedGreens']]},
  'Hello早餐店': {modeled:true,items:[['原味蛋餅（情境）','pancake'],['肉蛋吐司（情境）','porkToast'],['紅茶（情境）','tea']]},
  "那個鍋": {source:"https://www.ubereats.com/tw/store/%E9%82%A3%E5%80%8B%E9%8D%8B-%E4%B8%80%E4%B8%AD%E5%BA%97/ldm-A67HTceLIiquCgn6QQ", items:[["那個麵",'garlicNoodles'],['豆腐','braisedTofu'],['神級奶茶','milkTea']]},
  "日嚐拉麵館": {source:"https://www.ubereats.com/tw/store/%E4%B8%80%E4%B8%AD%E5%95%86%E5%9C%88-%E6%97%A5%E5%9A%90%E6%8B%89%E9%BA%B5%E9%A4%A8/Wko7ZVJUUB2MOA0pLL3TeA", items:[["九州豚骨拉麵",'tonkotsu'],['蒜香味噌拉麵','misoRamen']]},
  "JT燉飯": {source:"https://ivychi.com/jtrisotto/", items:[["煤礦工培根起司義大利麵",'carbonara'],["宇治抹茶蝦仁培根燉飯","shrimpMatchaRice"],["陽光夏威夷／明太子章魚燒雙拼披薩","seafoodPizza"]]},
  "OT蛋餅": {source:"https://www.youtube.com/watch?v=B80Gl3tRJy8", items:[["起司雞塊蛋餅",'otEgg'],["芋泥肉鬆蛋餅","taroEgg"],["原味蛋餅","pancake","https://www.ubereats.com/tw-en/store/一中商圈-ot蛋餅/oGSN3EpkTwSL8Zba4aK9XQ"]]},
  '三喜蛋餅': {source:'https://leonafunlife.com/3likeeggcake/', items:[['古早味麵糊蛋餅','pancake'],['泡菜蛋餅','kimchiPancake'],['鮪魚蛋餅','tunaPancake']]},
  "好吃河粉": {source:"https://shin.tw/goodeat-pho/", items:[["嫩牛肉湯河粉",'beefPho'],["泰式打拋豬飯","basilPorkRice"],["招牌炸春捲","springRoll"],["泰式奶茶","milkTea"]]},
  "求求辣年糕": {source:"https://www.518.com.tw/company-5l06BO.html", items:[["辣炒年糕",'tteok'],["起司辣炒年糕鍋","cheeseTteok","https://evavin.com/shop/qiuqiu-tteokbokki-yizhong"],["金馬利","gimmari","https://evavin.com/shop/qiuqiu-tteokbokki-yizhong"]]},
  "王子神谷日式厚鬆餅": {source:"https://www.youtube.com/watch?v=dqZ9LseJ5dU", items:[["日式厚鬆餅",'thickPancake'],["Oreo巧克力舒芙蕾","cookieSouffle","https://www.foodpanda.com.tw/restaurant/utb8/wang-zi-shen-gu-ri-shi-hou-song-bing-tai-zhong-zhong-dian-utb8"],["海鹽焦糖蜜蘋果舒芙蕾","appleSouffle","https://www.foodpanda.com.tw/restaurant/utb8/wang-zi-shen-gu-ri-shi-hou-song-bing-tai-zhong-zhong-dian-utb8"]]},
  "一中大本營": {source:"https://www.youtube.com/watch?v=B80Gl3tRJy8", items:[["起司雞塊蛋餅",'otEgg'],["芋泥肉鬆蛋餅","taroEgg"],["原味蛋餅","pancake","https://www.ubereats.com/tw-en/store/一中商圈-ot蛋餅/oGSN3EpkTwSL8Zba4aK9XQ"]]},
  "一中街打餅舖烙餅": {source:"https://taiwan17go.com/hitcookie/", items:[["九層塔蛋烙餅",'basilFlatbread'],["起司蛋烙餅","cheesePancake","https://achingfoodie.tw/echung/"],["咖哩豬肉蛋烙餅","curryPorkFlatbread","https://feliz.tw/snack202398/"]]},
  "朝氣美濃商行": {source:"https://ivychi.com/minotoast/", items:[["剁椒肉蛋吐司",'porkToast'],["美濃奶茶","milkTea","https://www.fonfood.com/store/3227911"]]},
  "晨家": {source:"https://guava.failover.uber.com/tw/store/%E6%99%A8%E5%AE%B6%E6%97%A9%E5%8D%88%E9%A4%90mornhome-%E4%B8%80%E4%B8%AD%E5%BA%97/sMN231cbVJCst7Ny5W3O7A", items:[["泡菜雞絲麵",'kimchiNoodles'],["起司薯泥蛋餅","potatoEgg","https://footinder.app/places/645110c2d625dd19311574b0"]]},
  "阿如早餐店": {source:"https://candylife.tw/arubrunch/", items:[["小籠包（4 顆）",'soupDumplings'],["鮪魚玉米起司蛋餅","tunaCornEgg"],["卡拉雞腿蛋餅","crispyChickenEgg"]]},
  "輕時代飲品製造所": {source:"https://ivychi.com/youngertimetea/", items:[["黑糖珍珠鮮奶",'brownSugarMilk'],["初日紅茶","tea"]]},
  "再睡5分鐘": {source:"https://www.foodpanda.com.tw/restaurant/ynha/zai-shui-5fen-zhong-tai-zhong-zhong-dian", items:[["熟八蕎麥歐蕾",'buckwheatMilk'],["日安紅","tea","https://maxfoodfun.com/napteazzz-taichung/"],["日安紅珍珠歐蕾","freshBobaTea","https://vivawei.tw/napteazzz/"],["香芋啵啵","taroBoba","https://vivawei.tw/napteazzz/"]]},
  "金色魔法紅茶": {source:"https://shin.tw/g-colour1/", items:[["香檳皇后",'estateTea'],["香檳皇后拿鐵","freshTea"]]},
  "阿里山鐵道紅茶冰": {source:"https://www.ubereats.com/tw/store/%E4%B8%80%E4%B8%AD%E5%95%86%E5%9C%88-%E9%98%BF%E9%87%8C%E5%B1%B1%E9%90%B5%E9%81%93%E7%B4%85%E8%8C%B6-%E4%B8%89%E6%B0%91%E5%BA%97/fqr7BtPjWDuucZgVFf1pEw", items:[["紅茶冰",'tea'],["冬瓜紅茶","winterTea"],["特濃鮮奶茶","freshTea"],["冬瓜鮮奶","winterMilk"],["珍珠紅茶","bobaTea"],["珍珠奶茶","pearlMilkTea"]]},
  "山裏山外": {source:"https://travel.yam.com/article/128321", items:[["芋泥剉冰",'taroIce'],["綜合豆花","soyPudding","https://www.walkerland.com.tw/article/view/339174"]]},
  "艾德咖啡": {source:"https://maxfoodfun.com/add-coffee/", items:[["雙Q奶茶",'doubleQMilkTea'],["檸檬蘆薈","lemonAloe","https://www.youtube.com/watch?v=4Xwrs2JarLQ"]]},
  "和記傻瓜麵": {source:"https://taiwan17go.com/foolnoodle/", items:[["梅干燒肉拉麵",'porkGreensRamen'],["傻瓜麵","foolNoodles","https://sweetpotato.tw/hutchison-fools-noodles/"],["招牌豆腐","preservedEggTofu"]]},
  "全方位自助餐": {source:"https://taiwan17go.com/fangwei/", items:[["炸雞腿（單點）",'friedDrumstick'],["白飯（小碗）","plainRice"],["古早味紅茶（內用）","tea"]]},
  "古早味便當": {source:"https://niniandblue.com/blog/post/chenbox", items:[["炸雞腿便當",'drumstickBento'],["滷排骨飯","porkChopRice"]]},
  "阿六飯筒": {source:"https://www.ubereats.com/tw-en/store/%E9%98%BF%E5%85%AD%E9%A3%AF%E7%AD%92/qkQ9cYWRS_mzCyWoKqnRkA", items:[["肉燥飯",'mincedPorkRice'],["紫菜湯","seaweedSoup","https://amigo0728.pixnet.net/blog/posts/5071127976"]]},
  "健美先生-激炸滷味": {source:"https://news.ustv.com.tw/food/2405", items:[["冠軍大腸頭",'braisedIntestine'],["芋粿","friedTaroCake","https://taichung.xxxblog.jp/archives/14167305.html"]]},
  "微滷": {source:"https://taiwan17go.com/wq603/", items:[["雞蛋豆腐",'eggTofu'],["雞湯","chickenSoup"]]},
  "滷王滷味": {source:"https://yizhong.taiwan-hong.com/store_detail.php?id=46", items:[["吉士包",'cheeseFishCake']]},
};


const electricityFactor = 0.467;
const mealProfiles = {
  dryIce:{ingredients:[['牛奶冰淇淋',160,3],['蜜花豆',60,1.5],['酸梅糖漿',22,1.5]],kwh:0.12},
  plumIce:{ingredients:[['酸梅糖漿',65,1.5]],kwh:0.06},
  potatoEgg:{ingredients:[['餅皮',60,1.6],['蛋',55,4.5],['薯泥',75,1.1],['起司',18,12],['食用油',8,3]],kwh:0.13},
  foolNoodles:{ingredients:[['麵條',130,1.6],['青蔥與醬料',20,1]],kwh:0.16},
  lemonAloe:{ingredients:[['檸檬汁',45,0.8],['蘆薈',60,1],['糖',25,1.5]],kwh:0.05},
  beefBrothNoodles:{ingredients:[['麵條',130,1.6],['牛肉湯底',250,1.8],['青蔥',10,0.8]],kwh:0.23},
  seaweedSoup:{ingredients:[['大骨湯底',230,1.2],['紫菜',6,2]],kwh:0.13},
  friedTaroCake:{ingredients:[['芋頭',70,1.1],['米粉',26,4],['食用油',13,3]],kwh:0.16},
  curryPorkFlatbread:{ingredients:[['餅皮',75,1.6],['豬肉',60,6],['蛋',55,4.5],['咖哩及油',22,3]],kwh:0.18},
  plainPirateRice:{ingredients:[['糯米（乾重）',95,4],['豬肉片',65,6],['蛋',55,4.5],['菜脯與肉鬆',25,3]],kwh:0.23},
  wasabiTakoyaki:{ingredients:[['麵糊',120,1.6],['章魚',35,5],['海苔芥末與醬料',28,3]],kwh:0.18},
  winterTea: {ingredients:[["冬瓜糖漿",45,1.5],["茶葉",5,3.3]],kwh:0.07},
  freshTea: {ingredients:[["鮮奶",160,3],["茶葉",6,3.3],["糖",18,1.5]],kwh:0.07},
  winterMilk: {ingredients:[["鮮奶",160,3],["冬瓜糖漿",45,1.5]],kwh:0.07},
  bobaTea: {ingredients:[["茶葉",5,3.3],["糖",20,1.5],["珍珠",65,1.6]],kwh:0.09},
  pearlMilkTea: {ingredients:[["奶精",22,3],["茶葉",5,3.3],["珍珠",65,1.6]],kwh:0.09},
  freshBobaTea: {ingredients:[["鮮奶",160,3],["茶葉",6,3.3],["珍珠",65,1.6],["糖",18,1.5]],kwh:0.09},
  taroBoba: {ingredients:[["鮮奶",160,3],["芋泥",65,1.1],["粉圓",45,1.6]],kwh:0.1},
  taroMilk: {ingredients:[["鮮奶",180,3],["芋泥",75,1.1]],kwh:0.08},
  yogurtGreenTea: {ingredients:[["發酵乳飲料",90,3],["茶葉",5,3.3],["糖",18,1.5]],kwh:0.06},
  halfBeef: {ingredients:[["麵皮",80,1.6],["牛肉",55,28],["蛋",40,4.5],["食用油",10,3]],kwh:0.15},
  halfPork: {ingredients:[["麵皮",80,1.6],["豬肉",55,6],["蛋",40,4.5],["食用油",10,3]],kwh:0.15},
  halfChicken: {ingredients:[["麵皮",80,1.6],["雞肉",55,7],["蛋",40,4.5],["食用油",10,3]],kwh:0.15},
  taroEgg: {ingredients:[["餅皮",60,1.6],["蛋",55,4.5],["芋泥",50,1.1],["肉鬆",18,6],["食用油",8,3]],kwh:0.13},
  tunaCornEgg: {ingredients:[["餅皮",60,1.6],["蛋",55,4.5],["鮪魚",40,6],["玉米",20,1],["起司",18,12]],kwh:0.13},
  crispyChickenEgg: {ingredients:[["餅皮",60,1.6],["蛋",55,4.5],["雞腿肉",90,7],["裹粉與炸油",25,2.5]],kwh:0.22},
  peanutSoy: {ingredients:[["豆花",180,1.4],["花生",35,2.5],["糖",20,1.5]],kwh:0.09},
  bobaSoy: {ingredients:[["豆花",180,1.4],["珍珠",50,1.6],["糖",20,1.5]],kwh:0.1},
  cookieSouffle: {ingredients:[["麵粉",65,1.6],["蛋",95,4.5],["鮮奶與卡士達",85,3],["巧克力餅乾",25,4]],kwh:0.22},
  appleSouffle: {ingredients:[["麵粉",65,1.6],["蛋",95,4.5],["鮮奶",65,3],["蘋果",65,0.7],["焦糖",22,1.5]],kwh:0.24},
  purpleCake: {ingredients:[["糯米粉",70,4],["紫地瓜",30,0.9],["糖與油",22,2.5]],kwh:0.14},
  matchaCake: {ingredients:[["糯米粉",75,4],["抹茶粉",5,3.3],["糖與油",22,2.5]],kwh:0.14},
  jellyIce: {ingredients:[["粉粿",95,1.6],["糖漿",30,1.5],["配料",35,1.1]],kwh:0.09},
  preservedEggTofu: {ingredients:[["豆腐",130,2],["皮蛋",55,4.5],["小黃瓜和炸醬",30,1.8]],kwh:0.05},
  basilPorkRice: {ingredients:[["白米（乾重）",85,4],["豬肉",95,6],["九層塔與蔬菜",65,0.85],["食用油",12,3]],kwh:0.28},
  springRoll: {ingredients:[["春捲皮",55,1.6],["豬肉",40,6],["蔬菜",70,0.8],["分攤炸油",15,3]],kwh:0.21},
  plainRice: {ingredients:[["白米（乾重）",55,4]],kwh:0.08},
  porkChopRice: {ingredients:[["白米（乾重）",85,4],["豬排",115,6],["蔬菜",110,0.8],["滷汁",30,2]],kwh:0.27},
  cheeseTteok: {ingredients:[["年糕與麵",210,2.2],["魚板",65,4],["起司",35,12],["蔬菜及蛋",90,2.5]],kwh:0.32},
  gimmari: {ingredients:[["冬粉",65,1.6],["海苔與麵衣",25,2],["分攤炸油",15,3]],kwh:0.16},
  chickenSoup: {ingredients:[["雞肉",70,7],["蔬菜",50,0.8]],kwh:0.22},
  shrimpMatchaRice: {ingredients:[["白米（乾重）",95,4],["蝦仁",65,8],["培根",40,6],["乳製品與抹茶",65,3]],kwh:0.28},
  seafoodPizza: {ingredients:[["麵粉",140,1.6],["起司",85,12],["火腿、章魚與明太子",110,6],["鳳梨與醬料",80,1]],kwh:0.41},
  slicedBeef: {ingredients:[["牛肉",110,28]],kwh:0.09},
  slicedPork: {ingredients:[["豬肉",110,6]],kwh:0.09},
  friedDough: {ingredients:[["麵粉",60,1.6],["分攤炸油",14,3]],kwh:0.14},
  scallopPasta: {ingredients:[["義大利麵（乾重）",100,1.6],["干貝與其他海鮮",120,6],["鮮奶油與魚卵醬",60,5]],kwh:0.29},
  friedSquid:{ingredients:[['魷魚',110,5],['裹粉',24,1.6],['分攤炸油',14,3]],kwh:0.18},
  friedFishBalls:{ingredients:[['魚漿',100,4],['分攤炸油',12,3]],kwh:0.13},
  custardCake:{ingredients:[['麵糊',50,1.6],['卡士達餡',40,3]],kwh:0.08},
  peanutCake:{ingredients:[['麵糊',50,1.6],['花生',18,2.5],['麻糬',24,2.5]],kwh:0.08},
  misoRamen:{ingredients:[['麵條',130,1.6],['豬肉',55,6],['味噌與湯底',95,2],['蛋與蔬菜',55,2.5]],kwh:0.25},
  spicyRamen:{ingredients:[['麵條',130,1.6],['豬肉',55,6],['湯底',90,2],['辣油',12,3]],kwh:0.25},
  kimchiRamen:{ingredients:[['麵條',130,1.6],['豬肉',55,6],['泡菜',45,1],['湯底',90,2]],kwh:0.25},
  abaloneRamen:{ingredients:[['麵條',130,1.6],['加工海鮮與火鍋料',55,5],['牛奶湯底',100,3],['蛋與蔬菜',55,2.5]],kwh:0.26},
  duckBloodTofu:{ingredients:[['鴨血',100,3],['臭豆腐',120,2],['麻辣湯底',100,2],['油與調味',18,3]],kwh:0.27},
  braisedPork:{ingredients:[['豬肉',90,6],['滷汁分攤',40,2]],kwh:0.14},
  braisedGreens:{ingredients:[['青菜',130,0.8],['滷汁分攤',30,2]],kwh:0.10},
  braisedTofu:{ingredients:[['板豆腐',120,2],['滷汁分攤',30,2]],kwh:0.12},
  milkTea:{ingredients:[['奶精',22,3],['茶葉',5,3.3],['糖',25,1.5]],kwh:0.06},
  smokedChickenPancake:{ingredients:[['餅皮',60,1.6],['蛋',55,4.5],['燻雞',60,7],['食用油',8,3]],kwh:0.13},
  sausagePancake:{ingredients:[['餅皮',60,1.6],['蛋',55,4.5],['豬肉香腸',55,6],['食用油',8,3]],kwh:0.13},
  hotPotNoodles:{ingredients:[['意麵',90,1.6],['豬肉',40,6],['蛤蜊及火鍋料',65,4],['蔬菜',55,0.8]],kwh:0.23},
  kimchiPancake:{ingredients:[['餅皮',60,1.6],['蛋',55,4.5],['泡菜',35,1],['食用油',8,3]],kwh:0.11},
  tunaPancake:{ingredients:[['餅皮',60,1.6],['蛋',55,4.5],['鮪魚',50,6],['食用油',8,3]],kwh:0.11},
  chicken: {name:'炸雞排', ingredients:[['雞肉',180,7],['裹粉',25,1.6],['分攤炸油',18,3]], kwh:0.24},
  bento: {name:'雞肉便當', ingredients:[['白米（乾重）',85,4],['雞肉',120,7],['蔬菜',120,0.8],['食用油',12,3]], kwh:0.30},
  tofu: {name:'豆腐蔬菜飯', ingredients:[['白米（乾重）',85,4],['豆腐',120,2],['蔬菜',150,0.8],['食用油',12,3]], kwh:0.24},
  pancake: {name:'蛋餅', ingredients:[['蛋',55,4.5],['餅皮',60,1.6],['食用油',8,3]], kwh:0.10},
  ice: {name:'冰淇淋剉冰', ingredients:[['冰淇淋',80,3],['蜜豆',60,1.5],['糖與配料',35,1.5]], kwh:0.10},
  milk: {name:'綠豆沙牛乳', ingredients:[['牛乳',180,3],['綠豆（乾重）',40,1.5],['糖',20,1.5]], kwh:0.08},
  snack: {name:'章魚燒', ingredients:[['麵糊',120,1.6],['章魚',35,5],['油與醬料',20,3]], kwh:0.18},
  coffee: {name:'拿鐵', ingredients:[['牛乳',200,3],['咖啡豆',18,15]], kwh:0.08},
  thaiGreen: {ingredients:[['高湯',350,0.7],['椰奶',85,2.5],['綠咖哩醬',28,2]], kwh:0.24},
  thaiTomYum: {ingredients:[['高湯',400,0.7],['冬蔭香料及調味',40,1.7]], kwh:0.22},
  thaiMilk: {ingredients:[['豚骨高湯',350,1.2],['牛乳',120,3],['調味',20,1.5]], kwh:0.27},
  bananaCrepe: {ingredients:[['餅皮',80,1.6],['香蕉',75,0.9],['巧克力醬',30,6]], kwh:0.12},
  beefCrepe: {ingredients:[['餅皮',80,1.6],['牛肉',70,27],['生菜與美乃滋',45,2]], kwh:0.16},
  spicyNoodles: {ingredients:[['麵條',180,1.6],['麻辣醬與油',30,3],['配菜',60,0.8]], kwh:0.18},
  pirateRice: {ingredients:[['米（乾重）',90,4],['豬里肌與辣腸',95,8],['雞蛋',50,4.5],['配料',35,2]], kwh:0.20},
  handPulledNoodles: {ingredients:[['麵條',150,1.6]], kwh:0.13},

  halfCorn: {ingredients:[["麵皮",85,1.6],["玉米",45,0.8],["起司",25,8],["蛋",50,4.5]], kwh:0.17},
  soyPudding: {ingredients:[["豆花",180,1.6],["紅豆、大豆與薏仁",90,1.6],["糖",20,1.5]], kwh:0.12},
  cheesePancake: {ingredients:[["麵糊",75,1.6],["起司",25,8],["蛋",50,4.5],["油",8,3]], kwh:0.12},
  pepperNoodles: {ingredients:[["麵條",165,1.6],["蛋",50,4.5],["醬料與油",25,2.4]], kwh:0.16},
  kumquatTea: {ingredients:[["茶葉",5,10],["金桔與梅子",35,1.2],["糖",22,1.5]], kwh:0.06},
  redBeanCake: {ingredients:[["麵糊",55,1.6],["紅豆餡",45,1.7]], kwh:0.1},
  filledTapioca: {ingredients:[["粉圓與豆餡",95,1.8],["糖",20,1.5]], kwh:0.12},
  sugarCake: {ingredients:[["糯米粉",85,4],["花生粉與糖",28,2],["分攤炸油",12,3]], kwh:0.18},
  sweetPotatoBalls: {ingredients:[["地瓜",100,0.7],["澱粉與糖",45,1.5],["分攤炸油",12,3]], kwh:0.18},
  largeSweetPotatoBalls: {ingredients:[["地瓜",200,0.7],["澱粉與糖",90,1.5],["分攤炸油",24,3]], kwh:0.36},
  souffle: {ingredients:[["麵粉",90,1.6],["蛋",100,4.5],["牛乳與鮮奶油",100,4],["粉圓與糖",60,1.8]], kwh:0.25},
  butterRamen: {ingredients:[["麵條",165,1.6],["奶油",22,12],["高湯與配菜",400,0.9]], kwh:0.26},
  garlicNoodles: {ingredients:[["麵條",155,1.6],["豬油、蒜末與醬汁",25,3]], kwh:0.14},
  tonkotsu: {ingredients:[["麵條",160,1.6],["叉燒",60,8],["糖心蛋",45,4.5],["高湯、豆皮與配菜",400,1.2]], kwh:0.3},
  carbonara: {ingredients:[["義大利麵",165,1.6],["培根",60,8],["起司與白醬",95,5]], kwh:0.25},
  otEgg: {ingredients:[["餅皮",70,1.6],["蛋",50,4.5],["雞塊",70,7],["起司",20,8]], kwh:0.15},
  beefPho: {ingredients:[["河粉",170,1.8],["牛肉",85,27],["高湯與配菜",350,1]], kwh:0.28},
  tteok: {ingredients:[["年糕",180,4],["醬料",45,2],["配菜",60,0.8]], kwh:0.22},
  thickPancake: {ingredients:[["麵粉",80,1.6],["蛋",85,4.5],["牛乳",60,3],["糖",20,1.5]], kwh:0.2},
  basilFlatbread: {ingredients:[["麵皮",100,1.6],["蛋",50,4.5],["九層塔與醬料",18,1.2],["油",10,3]], kwh:0.15},
  porkToast: {ingredients:[["吐司",75,1.6],["豬肉",70,8],["雞蛋",50,4.5],["剁椒醬",15,2]], kwh:0.16},
  kimchiNoodles: {ingredients:[["雞絲麵",120,1.6],["泡菜",70,1.1],["湯料",250,0.8]], kwh:0.2},
  soupDumplings: {ingredients:[["麵皮",70,1.6],["豬餡",70,8],["蔥與調味",10,1]], kwh:0.12},
  brownSugarMilk: {ingredients:[["鮮奶",260,3],["珍珠",65,1.5],["黑糖",28,1.5]], kwh:0.08},
  buckwheatMilk: {ingredients:[["鮮奶與乳料",220,3],["蕎麥",12,1.4],["糖",22,1.5]], kwh:0.06},
  estateTea: {ingredients:[["茶葉",8,10],["糖",15,1.5]], kwh:0.06},
  taroIce: {ingredients:[["芋頭",130,0.8],["糖",40,1.5],["配料",65,1.8]], kwh:0.12},
  doubleQMilkTea: {ingredients:[["茶葉",6,10],["奶料",100,3],["雙Q配料",65,1.5],["糖",25,1.5]], kwh:0.07},
  porkGreensRamen: {ingredients:[["麵條",170,1.6],["燒肉",70,8],["梅干菜與湯料",300,0.9]], kwh:0.24},
  friedDrumstick: {ingredients:[["雞腿",150,7],["裹粉",20,1.6],["分攤炸油",15,3]], kwh:0.24},
  drumstickBento: {ingredients:[["米（乾重）",85,4],["炸雞腿",145,7],["裹粉與分攤油",30,2.2],["配菜",120,0.8]], kwh:0.28},
  mincedPorkRice: {ingredients:[["白米（乾重）",80,4],["豬肉",65,8],["油與調味",25,2]], kwh:0.19},
  braisedIntestine: {ingredients:[["豬腸",120,8],["分攤炸油",12,3],["滷汁調味",30,1.5]], kwh:0.25},
  eggTofu: {ingredients:[["雞蛋豆腐",100,2.4],["煎油與滷汁",18,2]], kwh:0.14},
  cheeseFishCake: {ingredients:[["魚漿與澱粉",50,3],["起司餡",15,8],["滷汁",15,0.9]], kwh:0.12},
  tea: {name:'紅茶', ingredients:[['茶葉',5,10],['糖',25,1.5]], kwh:0.06}
};
function estimateMeal(profile, portions, kwh = profile.kwh) {
  if (!Number.isInteger(portions) || portions < 1 || portions > 99 ||
      !Number.isFinite(kwh) || kwh < 0 || kwh > 100) throw new RangeError('請輸入有效份數與用電');
  const ingredients = profile.ingredients.reduce((total,[,grams,factor]) => total + grams / 1000 * factor,0) * portions;
  const cooking = kwh * electricityFactor * portions;
  return {ingredients,cooking,total:ingredients+cooking};
}

// Time ranges are Taiwan local time, inferred from the cited observations and opening hours.
const seatingStudies = {
  '九州拉麵': {
    capacity:[18,38],
    capacityBasis:'舊食記記載兩層內用空間，依小型麵店桌位粗估。',
    capacitySource:'https://pbecky77.pixnet.net/blog/posts/10296074099',
    peak:[['12:00','13:30'],['17:30','19:30']],
    peakBasis:'同址食記記載用餐者多為學生，依午晚餐期推估。',
    peakSource:'https://ifoodie.tw/post/662877cceb74c489dedc3350'
  },
  'Morni 莫尼早餐一中店': {
    capacity:[12,28],
    capacityBasis:'依一中店食記所示的室內桌區粗估。',
    capacitySource:'https://starriver0616.pixnet.net/blog/posts/16028844800'
  },
  '三喜蛋餅': {
    capacity:[16,36],
    capacityBasis:'依東光路新址食記記載的寬敞用餐區粗估。',
    capacitySource:'https://safood.tw/sanxi'
  },
  '統元豆花': {
    capacity:[20,20],
    capacityBasis:'2022 年一中門市食記記載室內外約 20 席。',
    capacitySource:'https://ifoodie.tw/post/633b990fb4478b72345faf39',
    peak:[['14:00','17:00'],['18:30','20:00']],
    peakBasis:'依門市食記及冰品甜點用餐情境推估下午茶與晚餐後時段，來源未提供分時統計。',
    peakSource:'https://vocus.cc/article/68255b63fd89780001d5a4f2'
  },
  '一中豐仁冰': {
    capacity:[18,24],
    capacityBasis:'公開評論彙整有約 20 席的觀察，採 18–24 席反映長條座位與擺設變動。',
    capacitySource:'https://rankedfood.com/restaurant/%E4%B8%80%E4%B8%AD%E8%B1%90%E4%BB%81%E5%86%B0/',
    peak:[['14:00','17:00'],['18:30','20:00']],
    peakBasis:'育才街門市報導指出夏季午後與晚餐後較忙，區間由文字描述推估。',
    peakSource:'https://meneiji.tw/taichung-queue-food'
  },
  '微滷': {
    capacity:[8,12],
    capacityBasis:'公開店內照片可見兩張桌子周圍的椅位與兩張高腳椅；視角有遮擋，採 8–12 席粗估。',
    capacitySource:'https://taiwan.sharelife.tw/article_aid-17644.html',
    peak:[['17:30','19:30']],
    peakBasis:'採訪記載尖峰人潮多；依晚餐型湯滷味推估晚餐時段。',
    peakSource:'https://taiwan17go.com/wq603/'
  },
  '阿如早餐店': {
    capacity:[12,18],
    capacityBasis:'同址食記的兩張門面照片可見約十多位內用客與部分空凳。兩張照片視角重疊，採 12–18 席粗估。',
    capacitySource:'https://candylife.tw/arubrunch/',
    peak:[['08:30','11:30']],
    peakBasis:'同址食記記載 10:00 後招牌品項可能售完，平日 11:00 仍客滿。',
    peakSource:'https://candylife.tw/arubrunch/'
  },
  '泰丘鍋物': {
    peak:[['12:00','14:00'],['17:30','20:00']],
    peakBasis:'食記觀察平日中午開店前排隊；訂位平台有 11:30 和 17:00 早鳥場，據此推估之後較忙。',
    peakSource:'https://www.myfunnow.com/zh-tw/funbook/3037413681630/branch',
    observationSource:'https://orange-dog.com/thaihotpot/'
  },
  '海底撈火鍋 中友店': {
    peak:[['12:00','14:00'],['18:00','21:00']],
    peakBasis:'中友店報導指出熱門時段須候位，依聚餐餐期推估午餐與晚餐區間。',
    peakSource:'https://minitrip.tw/p/hai-di-lao-huo-guo-tai-zhong-zhong-you-dian/'
  },
  '樂丘廚房': {
    peak:[['11:30','14:00'],['14:30','16:30']],
    peakBasis:'一中店食記指出假日候位較久；區間以午餐與舒芙蕾下午茶情境推估。',
    peakSource:'https://www.walkerland.com.tw/article/view/186730'
  },
  'JT燉飯': {
    peak:[['12:00','14:00'],['18:00','20:00']],
    peakBasis:'報導指出假日容易滿座、店內有三層用餐區；時段按正餐習慣推估。',
    peakSource:'https://www.ftvnews.com.tw/news/detail/2023B06W0057'
  },
  '和記傻瓜麵': {
    peak:[['11:30','13:30'],['17:30','19:00']],
    peakBasis:'同址食記提到平日午餐常滿，午餐區間依觀察推估，晚餐區間按營業時間推估。',
    peakSource:'https://orange-dog.com/simplemen/'
  },
  '全方位自助餐': {
    peak:[['11:45','13:00'],['17:00','18:30']],
    peakBasis:'食記列營業為 11:30–13:30、16:30–19:30，兩區間取正餐中段推估。',
    peakSource:'https://taiwan17go.com/fangwei/'
  },
  '王印製麵': {
    peak:[['11:45','13:30']],
    peakBasis:'食尚玩家記載中午經過時人多，依午餐區間推估。',
    peakSource:'https://supertaste.tvbs.com.tw/amp/food/319294'
  },
  '求求辣年糕': {
    peak:[['12:00','14:00'],['18:00','20:00']],
    peakBasis:'門市介紹記載現場候位及午晚兩段營業；正餐中段為推估。',
    peakSource:'https://evavin.com/shop/qiuqiu-tteokbokki-yizhong'
  }
};

const seatModelByKind = {
  '早餐': [[0,22],[['07:30','10:30']]],
  '飲品': [[0,4],[['15:00','18:00']]],
  '甜點': [[0,12],[['14:00','17:00'],['18:30','20:00']]],
  '冰品': [[0,18],[['14:00','17:00'],['18:30','20:00']]],
  '咖啡與輕食': [[8,40],[['11:30','14:00'],['14:30','16:30']]],
  '麵食': [[4,32],[['11:45','13:30'],['17:30','19:30']]],
  '鍋物': [[8,56],[['12:00','14:00'],['17:30','20:00']]],
  '飯類': [[0,26],[['11:45','13:30'],['17:30','19:00']]],
  '小吃': [[0,12],[['16:30','20:00']]],
  '炸物': [[0,6],[['16:30','20:00']]],
  '餡餅': [[0,8],[['15:30','19:00']]]
};

function seatingFor(shop) {
  const study = seatingStudies[shop.name];
  const [typical, peak] = seatModelByKind[shop.kind] ?? seatModelByKind['飯類'];
  if (shop.amenities?.seats === false) {
    return {...study, capacity:[0,0], capacityBasis:'公開資料顯示無內用座位。', peak:[]};
  }
  const hasSeats = shop.amenities?.seats === true;
  const modeled = [hasSeats ? Math.max(2,typical[0]) : 0,typical[1]];
  return {
    ...study,
    capacity:study?.capacity ?? (shop.capacity ? [shop.capacity,shop.capacity] : modeled),
    capacityBasis:study?.capacityBasis ?? shop.capacityNote ??
      (hasSeats ? '有內用紀錄，席數按同類店型推估。' : '按同類店型推估，0 席代表可能僅供外帶。'),
    peak:study?.peak ?? peak
  };
}

function estimateSeats(capacity, day, time, peaks = [['11:30','13:30'],['17:30','20:00']]) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500 ||
      !['weekday','weekend'].includes(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }
  const [hour,minute] = time.split(':').map(Number);
  const minutes = hour * 60 + minute;
  if (minutes < 420 || minutes >= 1320) return null;
  const peak = peaks.some(([start,end]) => time >= start && time < end);
  const weekend = day === 'weekend';
  const [low,high] = peak ? (weekend ? [.75,.98] : [.60,.90]) :
    (weekend ? [.35,.65] : [.20,.50]);
  return {
    min: Math.floor(capacity * (1-high) + 1e-9),
    max: Math.ceil(capacity * (1-low) - 1e-9),
    peak
  };
}

if (typeof module !== 'undefined') module.exports = {roundTripDistance, seatingStudies, seatingFor, storeMenus, straightDistance, estimateSeats, restaurants, modes, features, mealProfiles, estimateMeal, emissions, selectRestaurants, mapEmbedUrl, googleDirectionsUrl, googleDirectionsEmbedUrl};
