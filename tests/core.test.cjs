const {test} = require('node:test');
const assert = require('node:assert/strict');
const {roundTripDistance, storeMenus, seatingFor, estimateSeats, mealProfiles, estimateMeal, features, restaurants, modes, emissions, selectRestaurants, mapEmbedUrl, googleDirectionsUrl, googleDirectionsEmbedUrl} = require('../data.js');

test('公開店家資料具有唯一 ID、合法距離與設施狀態', () => {
  assert.equal(restaurants.length, 50);
  const records = restaurants;
  assert.equal(new Set(records.map(item => item.id)).size, records.length);
  for (const item of records) {
    assert.ok(item.km == null || (Number.isFinite(item.km) && item.km > 0));
    for (const [key,value] of Object.entries(item.amenities ?? {})) {
      assert.ok(Object.hasOwn(features,key));
      assert.equal(typeof value,'boolean');
    }
  }
  assert.ok(restaurants.every(item => item.price || !item.budget.includes('undefined')));
  for (const item of restaurants) {
    if (item.source) assert.equal(new URL(item.source).protocol,'https:');
    assert.doesNotMatch(item.source ?? '', /if\.nutc\.edu\.tw/);
  }
});
test('可量化的往返交通係數與 0.5 km 已知答案', () => {
  assert.deepEqual(Object.values(modes).filter(([,rate]) => rate != null).map(([,rate]) => emissions(0.5, rate)), [0,0,0.09,0.2]);
  assert.equal(emissions(0, 0.2),0);
});
test('拒絕負值、空值、非數值及無限大', () => {
  for (const value of [-1,NaN,Infinity,null,'0.5']) {
    assert.throws(() => emissions(value,0.2),RangeError);
    assert.throws(() => emissions(0.5,value),RangeError);
  }
});
test('搜尋、設施交集與未知狀態', () => {
  assert.deepEqual(selectRestaurants(restaurants,'',['wifi'],'near').map(item => item.name),['樂丘廚房','泰丘鍋物']);
  assert.equal(selectRestaurants(restaurants,'',['drink'],'near').length,6);
});
test('排序不修改原始資料', () => {
  const input = [restaurants[1], restaurants[0]];
  assert.deepEqual(selectRestaurants(input,'',[],'near').map(x=>x.id),['fried','ice']);
  assert.equal(input[0].id,'ice');
});
test('Google Maps 嵌入網址使用店家名稱和地址', () => {
  const url = new URL(mapEmbedUrl(restaurants[1]));
  assert.equal(url.origin,'https://www.google.com');
  assert.equal(url.searchParams.get('output'),'embed');
  assert.equal(url.searchParams.get('q'),'一中豐仁冰 臺中市北區育才街3巷4號之6');
  assert.match(new URL(mapEmbedUrl({name:'測試店'})).searchParams.get('q'),/臺中市北區/);
  assert.equal(new URL(mapEmbedUrl(restaurants[1],[24.151,120.682])).searchParams.get('q'),'24.151,120.682');
});
test('餐點分開計算食材與分攤用電，且依份數縮放', () => {
  const one = estimateMeal(mealProfiles.chicken,1);
  assert.equal(one.ingredients.toFixed(3),'1.354');
  assert.equal(one.cooking.toFixed(3),'0.112');
  assert.equal(estimateMeal(mealProfiles.chicken,2).total,one.total*2);
  assert.equal(estimateMeal(mealProfiles.chicken,1,0).total,one.ingredients);
  assert.throws(()=>estimateMeal(mealProfiles.chicken,1.5),RangeError);
  assert.throws(()=>estimateMeal(mealProfiles.chicken,1,NaN),RangeError);
});
test('座位區間依時段與平假日改變，拒絕無效輸入', () => {
  assert.deepEqual(estimateSeats(30,'weekday','12:00'),{min:3,max:12,peak:true});
  assert.deepEqual(estimateSeats(30,'weekend','12:00'),{min:0,max:8,peak:true});
  assert.deepEqual(estimateSeats(30,'weekend','14:00'),{min:10,max:20,peak:false});
  assert.equal(estimateSeats(30,'weekday','22:00'),null);
  assert.equal(estimateSeats(0,'weekday','12:00'),null);
  const afternoon = [['14:00','17:00']];
  assert.equal(estimateSeats(20,'weekday','12:00',afternoon).peak,false);
  assert.equal(estimateSeats(20,'weekday','14:00',afternoon).peak,true);
  assert.equal(estimateSeats(20,'weekday','17:00',afternoon).peak,false);
});
test('店家菜單資料只列個別門市品項，每道都有可用配方', () => {
  const stores = restaurants;
  assert.ok(stores.every(store => storeMenus[store.name]?.items.length));
  for (const [name, menu] of Object.entries(storeMenus)) {
    const store = stores.find(item => item.name === name);
    assert.ok(store,name);
    if (!menu.modeled) assert.equal(new URL(menu.source).protocol,'https:');
    if (menu.modeled) assert.equal(menu.source,undefined);
    assert.ok(menu.items.length);
    assert.equal(new Set(menu.items.map(([,id])=>id)).size,menu.items.length);
    for (const [title,id] of menu.items) {
      assert.ok(title && mealProfiles[id],id);
      assert.ok(estimateMeal(mealProfiles[id],1).total > 0);
    }
  }
  for (const store of restaurants) {
    const {capacity:[low,high],peak} = seatingFor(store);
    assert.ok(Number.isInteger(low) && Number.isInteger(high) && low >= 0 && high >= low,store.name);
    assert.ok(high === 0 || peak.length > 0,store.name);
  }
  assert.deepEqual(seatingFor(stores.find(store=>store.name==='金色魔法紅茶')).capacity,[0,0]);
  assert.equal(storeMenus['泰丘鍋物'].items.length,3);
  assert.equal(storeMenus['日嚐拉麵館'].items[0][0],'九州豚骨拉麵');
  assert.equal(stores.find(store=>store.name==='統元豆花').capacity,20);
});
test('公開店家以各據點步行去回程計算，缺少資料保留空值', () => {
  const routes = restaurants.filter(shop => shop.walking);
  assert.equal(routes.length,48);
  for (const {walking} of routes) assert.ok(walking.outMeters > 0 && walking.backMeters > 0);
  assert.ok(new Set(routes.map(shop=>roundTripDistance(shop))).size > 25);
  assert.equal(roundTripDistance({km:0.3}),null);
  assert.equal(roundTripDistance({walking:{outMeters:150,backMeters:190}}),0.34);
  const sorted = selectRestaurants(restaurants,'',[],'near');
  assert.ok(sorted.slice(-2).every(shop=>!shop.walking));
});
test('五種交通方式正確傳給 Google 地圖', () => {
  const expected = {walk:'walking',bike:'bicycling',scooter:'two-wheeler',car:'driving',transit:'transit'};
  for (const [mode,travelMode] of Object.entries(expected)) {
    const url = new URL(googleDirectionsUrl(restaurants[1],mode,[24.14754,120.68437]));
    assert.equal(url.pathname,'/maps/dir/');
    assert.equal(url.searchParams.get('travelmode'),travelMode);
    assert.equal(url.searchParams.get('origin'),'24.14754,120.68437');
    assert.match(url.searchParams.get('destination'),/一中豐仁冰/);
    const embed = new URL(googleDirectionsEmbedUrl(restaurants[1],mode,[24.14754,120.68437]));
    assert.equal(embed.searchParams.get('saddr'),'24.14754,120.68437');
    assert.equal(embed.searchParams.get('daddr'),url.searchParams.get('destination'));
    assert.equal(embed.searchParams.get('dirflg'),{walk:'w',bike:'b',scooter:'l',car:'d',transit:'r'}[mode]);
  }
  assert.match(new URL(googleDirectionsUrl(restaurants[1],'transit')).searchParams.get('origin'),/三民校區/);
});
