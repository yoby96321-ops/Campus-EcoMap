'use strict';
const $ = id => document.getElementById(id);
const el = (tag, label, className) => {
  const item = document.createElement(tag);
  if (label) item.textContent = label;
  if (className) item.className = className;
  return item;
};
const link = (label, href) => {
  const item = el('a', label, 'button');
  item.href = href;
  item.target = '_blank';
  item.rel = 'noopener noreferrer';
  return item;
};
const price = item => item.price ?? item.budget;
const distanceText = item => {
  if (item.walking) {
    const {outMeters,backMeters} = item.walking;
    return '步行去程約 ' + (outMeters / 1000).toFixed(2) + ' km · 來回約 ' + ((outMeters+backMeters) / 1000).toFixed(2) + ' km';
  }
  return '地圖以店名搜尋';
};
for (const [key, label] of Object.entries(features)) {
  const wrapper = el('label', '', 'check');
  const control = el('input');
  control.type = 'checkbox';
  control.value = key;
  const caption = el('span',label);
  caption.dataset.feature = key;
  wrapper.append(control, caption);
  $('features').append(wrapper);
}

function buildSeatEstimate(item) {
  const section = el('section','','seat-estimate');
  section.append(el('h3','到店座位估算'));
  const study = seatingFor(item);
  const [low,high] = study.capacity;
  const total = low === high ? String(low) : low + '–' + high;
  const capacity = el('p','總座位約 ' + total + ' 席 · ' + study.capacityBasis,'muted');
  section.append(capacity);
  if (study.peak.length) {
    const ranges = study.peak.map(range => range.join('–')).join('、');
    const basis = el('p',study.peakBasis ?? '依店型與常見用餐時段推估。','muted');
    if (study.peakSource) basis.append(' ',link('時段參考 ↗',study.peakSource));
    if (study.observationSource) basis.append(' ',link('候位觀察 ↗',study.observationSource));
    section.append(el('p','推估高峰（臺灣時間） ' + ranges,'seat-peak'),basis);
  }
  const controls = el('div','','filters');
  const day = el('select');
  day.add(new Option('平日','weekday'));
  day.add(new Option('週末','weekend'));
  const dayLabel = el('label','日期類型');
  dayLabel.append(day);
  const arrival = el('fieldset','','arrival-time');
  arrival.append(el('legend','到店時間'));
  const [defaultHour,defaultMinute] = (study.peak[0]?.[0] ?? '12:00').split(':');
  const hour = el('select');
  const minute = el('select');
  for (const [select,label,count,initial] of [[hour,'到店小時',24,defaultHour],[minute,'到店分鐘',60,defaultMinute]]) {
    select.setAttribute('aria-label',label);
    for (let index=0; index<count; index++) {
      const value = String(index).padStart(2,'0');
      select.add(new Option(value + (select === hour ? ' 時' : ' 分'),value));
    }
    select.value = initial;
  }
  const clock = el('div','','arrival-parts');
  clock.append(hour,minute);
  arrival.append(clock);
  controls.append(dayLabel,arrival);
  const result = el('output','','seat-output');
  result.setAttribute('aria-live','polite');
  const update = () => {
    if (high === 0) {
      result.textContent = '0 席。建議外帶。';
      return;
    }
    const time = hour.value + ':' + minute.value;
    const upper = estimateSeats(high,day.value,time,study.peak);
    const lower = low ? estimateSeats(low,day.value,time,study.peak) : upper && {min:0, peak:upper.peak};
    result.textContent = lower && upper
      ? '預估剩 ' + lower.min + '–' + upper.max + ' 席（' + (lower.peak ? '推估高峰' : '推估離峰') + '）' +
        (lower.peak ? '。建議提早到或改離峰。' : '。這個時段較有機會入座。')
      : '座位模型涵蓋 07:00–21:59，其他時段請先確認營業時間。';
  };
  controls.addEventListener('input',update);
  controls.addEventListener('change',update);
  section.append(controls,result,el('p','剩餘席數使用尖離峰占用率模型。模型時段與實際營業時間請分開查看。','muted'));
  update();
  return section;
}


let originPoint = null;
let locationRequest = 0;
function recommendedDistance(item) {
  const point = item.walking?.point ?? shopPoints[item.name];
  return originPoint && point ? straightDistance(originPoint,point) : null;
}
function setRecommendation(point, label) {
  originPoint = point;
  $('sort').value = point ? 'location' : 'near';
  $('location-option').disabled = !point;
  $('location-status').textContent = point
    ? label + ' · 有座標的店家按直線距離排序，其餘保留原始順序。'
    : '已恢復校園距離排序。';
  renderCards(true);
}
$('campus-origin').addEventListener('click',() => {
  locationRequest++;
  setRecommendation(null);
  $('location-status').textContent = '以三民校區站為起點，按步行去程距離排序。';
});
$('reset-origin').addEventListener('click',() => {
  locationRequest++;
  setRecommendation(null);
});
$('my-location').addEventListener('click',() => {
  const request = ++locationRequest;
  const unavailable = () => {
    if (request === locationRequest) $('location-status').textContent = '無法取得裝置位置，可改用三民校區推薦。';
  };
  if (!navigator.geolocation) return unavailable();
  $('location-status').textContent = '等待瀏覽器定位授權…';
  navigator.geolocation.getCurrentPosition(({coords}) => {
    if (request === locationRequest) setRecommendation([coords.latitude,coords.longitude],'以你的裝置位置為起點');
  },unavailable,{timeout:10000,maximumAge:60000});
});
const mealAmount = value => value.toFixed(3) + ' kg CO₂e';
function buildOrder(item, trip) {
  const panel = el('section','','order-panel');
  const menu = storeMenus[item.name];
  const pick = el('select');
  for (const [name,id] of menu.items) pick.add(new Option(name,id));
  const menuSource = menu.source ? link('查看品項來源 ↗',menu.source) : null;
  const portions = el('input');
  Object.assign(portions,{type:'number',min:'1',max:'99',step:'1',value:'1',required:true});
  const mode = el('select');
  for (const [key,[label]] of Object.entries(modes)) mode.add(new Option(label,key));
  mode.value = 'scooter';
  const fields = el('div','','filters');
  for (const [name,input] of [['想點什麼？',pick],['份數',portions],['交通方式',mode]]) {
    const caption = el('label',name);
    caption.append(input);
    fields.append(caption);
  }
  const campusKm = roundTripDistance(item);
  let km = campusKm;
  const distance = el('p',distanceText(item) +
    (item.walking ? '。各交通方式使用同一段步行距離比較，實際車行路線可能不同。' : ''),'muted');
  const summary = el('div','','order-summary');
  summary.setAttribute('aria-live','polite');
  const rows = el('dl','','meal-results');
  const values = new Map();
  for (const [key,label] of [
    ['ingredients','食材上游'],['cooking','店家備製與烹調用電'],['meal','餐點製作小計'],
    ['traffic','一人往返交通'],['total','餐點與交通合計']
  ]) {
    const result = el('dd');
    result.dataset.emission = key;
    values.set(key,result);
    rows.append(el('dt',label),result);
  }
  const message = el('p');
  summary.append(message,rows);
  const assumptions = el('details');
  const ingredients = el('ul');
  assumptions.append(el('summary','查看配方假設'),ingredients);
  const comparison = el('details');
  const transportRows = el('ul');
  comparison.append(el('summary','比較交通方式'),transportRows);
  function updateComparison() {
    comparison.hidden = trip.located;
    transportRows.replaceChildren(...Object.values(modes).map(([label,factor]) =>
      el('li',label + ' ' + (campusKm == null || factor == null ? '僅提供餐點估算' : mealAmount(campusKm * factor)))));
  }
  function calculate() {
    const profile = mealProfiles[pick.value];
    if (menuSource) menuSource.href = menu.items[pick.selectedIndex]?.[2] ?? menu.source;
    const valid = Boolean(profile && portions.validity.valid);
    rows.hidden = !valid;
    assumptions.hidden = !valid;
    message.hidden = valid;
    if (!valid) {
      message.textContent = profile ? '請輸入 1–99 份整數。' : '請選擇餐點。';
      return;
    }
    const meal = estimateMeal(profile,portions.valueAsNumber);
    const factor = modes[mode.value][1];
    const traffic = km == null || factor == null ? null : km * factor;
    for (const [key,value] of Object.entries({
      ingredients:meal.ingredients,cooking:meal.cooking,meal:meal.total,traffic,total:traffic == null ? null : meal.total+traffic
    })) values.get(key).textContent = value == null ? '僅提供餐點估算' : mealAmount(value);
    ingredients.replaceChildren(el('li','選擇的品項：' + pick.selectedOptions[0].text),...profile.ingredients.map(([name,grams,factor]) =>
      el('li',name + ' ' + grams + ' g × ' + factor + ' kg CO₂e／kg')),
      el('li','每份分攤用電 ' + profile.kwh + ' kWh × 0.467 kg CO₂e／kWh'));
  }
  fields.addEventListener('input',calculate);
  fields.addEventListener('change',calculate);
  panel.append(el('h3','點餐與碳足跡'),el('p','配方重量、食材係數與用電為估算。切換餐點、份數或交通方式即可更新結果。','muted'),
    fields,distance,summary,assumptions,comparison);
  if (menu.modeled) panel.prepend(el('p','同店型餐點情境 · 僅供碳排估算，實際供應以門市為準。','muted'));
  if (menuSource) panel.append(menuSource);
  mode.addEventListener('change',() => {
    trip.mode = mode.value;
    trip.refresh?.();
  });
  trip.update = (meters, description) => {
    km = trip.located ? (meters == null ? null : meters / 1000) : campusKm;
    distance.textContent = description;
    updateComparison();
    calculate();
  };
  updateComparison();
  calculate();
  return panel;
}


let nextRouteRequest = 0;
async function fetchStoreRoute(origin, destination, mode, signal) {
  const costing = {walk:'pedestrian',bike:'bicycle',scooter:'motor_scooter',car:'auto'}[mode];
  const locations = [origin,destination,origin].map(([lat,lon]) => ({lat,lon}));
  const url = new URL('https://valhalla1.openstreetmap.de/route');
  url.searchParams.set('json',JSON.stringify({locations,costing,format:'osrm',shape_format:'geojson'}));
  const now = Date.now();
  const delay = Math.max(0,nextRouteRequest - now);
  nextRouteRequest = now + delay + 1050;
  if (delay) await new Promise(resolve => setTimeout(resolve,delay));
  if (signal.aborted) throw signal.reason;
  const response = await fetch(url,{signal,headers:{'X-Client-Id':'yoby96321-ops.github.io/Campus-EcoMap'}});
  if (!response.ok) throw new Error('Routing request failed');
  const result = await response.json();
  const route = result.routes?.[0];
  if (result.code !== 'Ok' || route?.legs?.length !== 2 ||
      !route.legs.every(leg => Number.isFinite(leg.distance) && leg.distance >= 0) ||
      !route.geometry?.coordinates?.length) throw new Error('Route unavailable');
  return route;
}

function buildStoreMap(item, trip) {
  const section = el('section','','store-map');
  const map = el('iframe');
  map.title = item.name + '的 Google 地圖';
  map.loading = 'lazy';
  map.referrerPolicy = 'no-referrer';
  const locate = el('button','顯示我的位置與路線','button');
  locate.type = 'button';
  const showStore = el('button','恢復校區距離','outline');
  showStore.type = 'button';
  showStore.hidden = true;
  const actions = el('div','','actions');
  actions.append(locate,showStore);
  const introduction = '地圖預設從三民校區出發。按「顯示我的位置與路線」並允許定位後，座標會送至 Google 地圖及 OpenStreetMap 路線服務。';
  const status = el('p',introduction,'muted route-status');
  status.setAttribute('role','status');
  const destination = item.walking?.point ?? shopPoints[item.name];
  let origin;
  let locationRequest = 0;
  let controller;
  let trackingClose = false;


  trip.refresh = async () => {
    const start = trip.located ? origin : undefined;
    const embed = googleDirectionsEmbedUrl(item,trip.mode,start);
    if (map.src !== embed) map.src = embed;
    if (!trip.located) {
      if (trip.mode === 'transit') {
        status.textContent = '下方地圖顯示大眾運輸路線。';
      } else {
        status.textContent = introduction;
      }
      return;
    }
    controller?.abort();
    const current = new AbortController();
    controller = current;
    const mode = trip.mode;
    const label = modes[mode][0];
    if (mode === 'transit') {
      status.textContent = '下方地圖顯示從你的位置出發的大眾運輸路線。';
      trip.update(null,'大眾運輸路線與距離由 Google 地圖提供。');
      return;
    }
    if (!destination) {
      status.textContent = 'Google 地圖以店名搜尋，請確認門市。';
      trip.update(null,'門市沒有可用座標，暫以餐點估算。');
      return;
    }
    const loading = '正在查詢' + label + '往返路線…';
    trip.update(null,loading);
    status.textContent = loading;
    const timer = setTimeout(() => current.abort('timeout'),12000);
    try {
      const route = await fetchStoreRoute(origin,destination,mode,current.signal);
      if (controller !== current || !section.isConnected || !section.closest('dialog').open) return;
      const [out,back] = route.legs.map(leg => leg.distance);
      const km = meters => (meters / 1000).toFixed(2) + ' km';
      const detail = label + ' · 去程 ' + km(out) + ' · 回程 ' + km(back) + ' · 來回 ' + km(out + back);
      status.textContent = detail + '（OpenStreetMap 路網估算，Google 地圖可能採用不同路線）';
      trip.update(out + back,status.textContent);
    } catch {
      if (controller !== current || !section.isConnected || !section.closest('dialog').open) return;
      status.textContent = label + '路線暫時無法取得，可切換交通方式或重新定位。';
      trip.update(null,status.textContent);
    } finally {
      clearTimeout(timer);
    }
  };
  showStore.addEventListener('click',() => {
    locationRequest++;
    const prior = controller;
    controller = null;
    prior?.abort();
    trip.located = false;
    trip.update(null,distanceText(item) + (item.walking ? '（三民校區步行距離參考）' : ''));
    trip.refresh();
    locate.disabled = false;
    locate.textContent = '顯示我的位置與路線';
    locate.focus();
    showStore.hidden = true;
  });
  locate.addEventListener('click',() => {
    const current = ++locationRequest;
    const active = () => current === locationRequest && section.isConnected && section.closest('dialog').open;
    const unavailable = () => {
      if (!active()) return;
      locate.disabled = false;
      status.textContent = '無法取得位置。請確認瀏覽器已允許定位。';
    };
    if (!navigator.geolocation) return unavailable();
    locate.disabled = true;
    status.textContent = '正在取得你的裝置位置…';
    const dialog = section.closest('dialog');
    if (!trackingClose) {
      trackingClose = true;
      dialog.addEventListener('close',() => {
        locationRequest++;
        controller?.abort();
      },{once:true});
    }
    navigator.geolocation.getCurrentPosition(({coords}) => {
      if (!active()) return;
      origin = [coords.latitude,coords.longitude];
      trip.located = true;
      showStore.hidden = false;
      locate.textContent = '更新我的位置';
      locate.disabled = false;
      trip.refresh();
    },unavailable,{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
  });
  const attribution = el('p','','muted');
  attribution.append(link('OpenStreetMap 路線資料','https://www.openstreetmap.org/copyright'),' · ',
    link('修正地圖','https://www.openstreetmap.org/fixthemap'));
  attribution.querySelectorAll('a').forEach(anchor => anchor.classList.remove('button'));
  section.append(el('h3','位置與往返路線'),actions,status,map,attribution);
  trip.refresh();
  return section;
}

function openDetail(item) {
  const dialog = $('detail');
  const trip = {mode:'scooter',located:false};
  const title = el('h2', item.name);
  title.id = 'detail-title';
  const statuses = el('dl');
  const modeled = {
    power:'規劃時以自備電源為主',
    air:seatingFor(item).capacity[0] > 0 ? '冷氣以現場為準' : '規劃時以戶外或外帶為主',
    wifi:'規劃時以行動網路為主',
    drink:item.kind === '飲品' ? '推估有供應' : '規劃時以另購為主',
    seats:'見下方分時座位推估'
  };
  for (const [key,label] of Object.entries(features)) {
    const value = item.amenities?.[key];
    const status = el('dd',value === true ? '有' : value === false ? '無' : modeled[key]);
    const evidence = item.facilityEvidence?.[key];
    if (evidence) {
      const reference = link('來源',evidence[1]);
      reference.className = 'facility-source';
      reference.setAttribute('aria-label',label + '來源：' + evidence[2]);
      status.append(' · ',reference,el('small',evidence[2]));
    }
    statuses.append(el('dt',label),status);
  }
  const actions = el('div','','actions');

  $('detail-body').replaceChildren(title,...(item.note ? [el('p',item.note)] : []),el('p',[item.address,price(item),distanceText(item)].filter(Boolean).join(' · ')),buildOrder(item,trip),statuses,buildSeatEstimate(item));
  if (item.source) {
    actions.append(link(item.sourceName + ' ↗', item.source));
    $('detail-body').append(actions);
  }
  const map = buildStoreMap(item,trip);
  if (item.walking) {
    const route = item.walking;
    const description = el('p','起點為三民路「國立臺中科技大學」站。' +
      '去程約 ' + Math.round(route.outMeters) + ' 公尺，回程約 ' + Math.round(route.backMeters) + ' 公尺。' +
      (route.note ? ' ' + route.note : ''),'muted');
    map.prepend(description);
    if (route.source !== 'https://www.youtube.com/watch?v=B80Gl3tRJy8') {
      const source = el('div','','route-source');
      source.append(link('門市地址來源 ↗',route.source));
      description.after(source);
    }
  }
  $('detail-body').append(map);
  if (item.seatSource) actions.append(link('內用座位來源 ↗',item.seatSource));
  if (item.priceSource) actions.append(link('查看菜單或價格來源 ↗',item.priceSource));
  dialog.showModal();
  $('detail-body').scrollTop = 0;
}

function renderCards(animate = false) {
  const grid = $('cards');
  const previous = new Map([...grid.children].map(card => [card.dataset.store,card]));
  const canAnimate = animate === true && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const oldPositions = new Map();
  if (canAnimate) {
    for (const [id,card] of previous) {
      const bounds = card.getBoundingClientRect();
      oldPositions.set(id,bounds);
      card.getAnimations().forEach(animation => animation.cancel());
    }
  }
  const selected = [...$('features').querySelectorAll('input:checked')].map(control => control.value);
  const pool = restaurants.filter(item => !$('kind').value || item.kind === $('kind').value);
  const matches = selectRestaurants(pool, $('query').value, selected, $('sort').value);
  $('status').textContent = matches.length ? '公開店家 · ' + matches.length + ' 間' : '找不到符合條件的店家。可清除搜尋與篩選。';
  $('reset').hidden = matches.length !== 0;
  if ($('sort').value === 'location') {
    matches.sort((a,b) => (recommendedDistance(a) ?? Infinity) - (recommendedDistance(b) ?? Infinity));
  }
  grid.replaceChildren(...matches.map(item => {
    const nearby = $('sort').value === 'location' ? recommendedDistance(item) : null;
    const distance = $('sort').value === 'location'
      ? (nearby == null ? '地圖以店名搜尋' : '距起點約 ' + nearby.toFixed(2) + ' km（直線）')
      : distanceText(item);
    const meta = price(item) + ' · ' + distance;
    const existing = previous.get(item.id);
    if (existing) {
      existing.querySelector('.card-meta').textContent = meta;
      return existing;
    }
    const card = el('article','','card');
    card.dataset.store = item.id;
    const photo = el('img','','food');
    photo.src = 'assets/' + item.art + '.jpg';
    photo.alt = '';
    photo.loading = 'lazy';
    photo.decoding = 'async';
    const body = el('div','','card-body');
    const title = el('h3',item.name);
    const known = Object.entries(item.amenities ?? {}).filter(([,value]) => value === true).map(([key]) => features[key]);
    const detail = el('button','查看店家','outline');
    detail.setAttribute('aria-label','查看店家 ' + item.name);
    detail.addEventListener('click',() => openDetail(item));
    const [low,high] = seatingFor(item).capacity;
    const seatLabel = high === 0 ? '外帶' : '約 ' + (low === high ? low : low + '–' + high) + ' 席';
    body.append(el('span',[item.location, item.kind, '餐點示意'].filter(Boolean).join(' · '),'eyebrow'), title, el('p',meta,'muted card-meta'),el('p',[seatLabel,...known.filter(label => label !== features.seats)].join(' · '),'tag'),detail);
    card.append(photo,body);
    return card;
  }));
  if (canAnimate) {
    for (const card of grid.children) {
      const before = oldPositions.get(card.dataset.store);
      if (!before) continue;
      const after = card.getBoundingClientRect();
      const x = before.left - after.left;
      const y = before.top - after.top;
      if (x || y) card.animate([{transform:'translate(' + x + 'px,' + y + 'px)'},{transform:'none'}],
        {duration:460,easing:'cubic-bezier(.2,.75,.25,1)'});
    }
  }
}
function resetFilters() {
  $('query').value = '';
  $('kind').value = '';
  $('features').querySelectorAll('input').forEach(control => { control.checked = false; });
}
function initializeFilters() {
  for (const caption of $('features').querySelectorAll('[data-feature]')) {
    const key = caption.dataset.feature;
    const count = restaurants.filter(item => item.amenities?.[key] === true).length;
    caption.textContent = features[key] + '（' + count + '）';
  }
  resetFilters();
  const kinds = [...new Set(restaurants.map(item => item.kind))].sort((a,b) => a.localeCompare(b,'zh-Hant'));
  $('kind').replaceChildren(new Option('所有類型',''), ...kinds.map(kind => new Option(kind,kind)));
  renderCards();
}
$('query').addEventListener('input',renderCards);
$('features').addEventListener('change',renderCards);
$('sort').addEventListener('change',() => renderCards(true));
$('kind').addEventListener('change',renderCards);
$('reset').addEventListener('click',() => { resetFilters(); renderCards(); $('query').focus(); });
initializeFilters();
