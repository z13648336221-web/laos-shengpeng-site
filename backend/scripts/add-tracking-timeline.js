const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/data.json');

const getCityLabel = (cityCode) => {
  const labels = {
    'GZ': '广州', 'SZ': '深圳', 'KM': '昆明', 'DG': '东莞', 'FO': '佛山', 'YW': '义乌', 'SH': '上海', 'NJ': '宁波', 'CD': '成都', 'NB': '宁波',
    'VTE': '老挝·万象', 'LPQ': '老挝·琅勃拉邦', 'PKH': '老挝·巴色',
    'BKK': '泰国·曼谷', 'CM': '泰国·清迈', 'LCH': '泰国·林查班',
    'HCM': '越南·胡志明市', 'HAN': '越南·河内', 'DAD': '越南·岘港', 'HPH': '越南·海防'
  };
  return labels[cityCode] || cityCode;
};

const generateTimeline = (order) => {
  const now = new Date();
  const origin = getCityLabel(order.origin_city);
  const dest = getCityLabel(order.dest_city);
  
  const timeline = [];
  let currentTime = new Date(now);
  
  const addEvent = (status, description, location, hoursAgo) => {
    const eventTime = new Date(currentTime.getTime() - hoursAgo * 60 * 60 * 1000);
    timeline.push({
      time: eventTime.toISOString(),
      status: status,
      status_label: getStatusLabel(status),
      description: description,
      location: location
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '待处理',
      picked_up: '已揽收',
      in_transit: '运输中',
      departed: '已离港',
      customs: '清关中',
      delivered: '已签收',
      cancelled: '已取消',
      confirmed: '已确认'
    };
    return labels[status] || status;
  };

  const serviceInfo = {
    railway: {
      transport: '铁路运输',
      transitPoint: '磨憨口岸',
      route: '中老铁路'
    },
    thai_sea: {
      transport: '海运',
      transitPoint: '林查班港',
      route: '南海-泰国湾'
    },
    viet_sea: {
      transport: '海运',
      transitPoint: '海防港',
      route: '南海-北部湾'
    }
  };

  const service = serviceInfo[order.service_code] || serviceInfo.railway;

  switch (order.status) {
    case 'delivered':
      addEvent('delivered', `${dest} - 货物已签收`, dest, 0);
      addEvent('customs', `${dest} - 完成进口清关`, dest, 8);
      addEvent('in_transit', `${dest} - 本地配送中`, dest, 24);
      if (order.service_code === 'railway') {
        addEvent('departed', `${origin} - 列车出发`, origin, 48);
      } else {
        addEvent('departed', `${service.transitPoint} - 船舶离港`, service.transitPoint, 48);
      }
      addEvent('customs', `${origin} - 完成出口清关`, origin, 72);
      addEvent('picked_up', `${origin} - 货物已揽收`, origin, 80);
      addEvent('pending', '订单已创建', '', 96);
      break;

    case 'customs':
      addEvent('customs', `${dest} - 进口清关中`, dest, 0);
      addEvent('in_transit', `${service.route} - ${service.transport}途中`, '', 24);
      if (order.service_code === 'railway') {
        addEvent('departed', `${origin} - 列车已出发`, origin, 48);
      } else {
        addEvent('departed', `${service.transitPoint} - 船舶离港`, service.transitPoint, 48);
      }
      addEvent('customs', `${origin} - 完成出口清关`, origin, 72);
      addEvent('picked_up', `${origin} - 货物已揽收`, origin, 80);
      addEvent('pending', '订单已创建', '', 96);
      break;

    case 'in_transit':
      addEvent('in_transit', `${service.route} - ${service.transport}运输中`, '', 0);
      if (order.service_code === 'railway') {
        addEvent('departed', `${origin} - 列车已出发`, origin, 24);
      } else {
        addEvent('departed', `${service.transitPoint} - 船舶离港`, service.transitPoint, 24);
      }
      addEvent('customs', `${origin} - 完成出口清关`, origin, 48);
      addEvent('picked_up', `${origin} - 货物已揽收`, origin, 56);
      addEvent('pending', '订单已创建', '', 72);
      break;

    case 'departed':
      if (order.service_code === 'railway') {
        addEvent('departed', `${origin} - 列车已出发，途经磨憨口岸`, origin, 0);
      } else {
        addEvent('departed', `${service.transitPoint} - 船舶离港，驶往${dest}`, service.transitPoint, 0);
      }
      addEvent('customs', `${origin} - 完成出口清关`, origin, 24);
      addEvent('picked_up', `${origin} - 货物已揽收`, origin, 32);
      addEvent('pending', '订单已创建', '', 48);
      break;

    case 'picked_up':
      addEvent('picked_up', `${origin} - 货物已揽收，等待运输`, origin, 0);
      addEvent('pending', '订单已创建', '', 24);
      break;

    case 'confirmed':
      addEvent('confirmed', `订单已确认，预计从${origin}发往${dest}`, '', 0);
      addEvent('pending', '订单已创建', '', 12);
      break;

    case 'pending':
    default:
      addEvent('pending', `订单已创建，等待确认。预计从${origin}发往${dest}`, '', 0);
      break;
  }

  return timeline;
};

const main = () => {
  try {
    const content = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(content);

    data.data.orders.forEach(order => {
      order.timeline = generateTimeline(order);
    });

    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    console.log('✅ 物流轨迹更新成功！');
    console.log(`📦 共处理 ${data.data.orders.length} 个订单`);
  } catch (err) {
    console.error('❌ 更新失败:', err);
  }
};

main();