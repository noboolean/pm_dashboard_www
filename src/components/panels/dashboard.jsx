import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // 引入路由钩子
import { Box } from '@mui/material';

import { formatBytes } from '../../js/utils';

import Panel from './panel.jsx';
import ExternalInputCard from '../cards/externalInputCard.jsx';
import TemperatureCard from '../cards/temperatureCard.jsx';
import BatteryCard from '../cards/batteryCard.jsx';
import RaspberryPiPowerCard from '../cards/raspberryPiPowerCard.jsx';
import StorageCard from '../cards/storageCard.jsx';
import MemoryCard from '../cards/memoryCard.jsx';
import ProcessorCard from '../cards/processorCard.jsx';
import NetworkCard from '../cards/networkCard.jsx';
import { ModernTemperature, ModernProcessor, ModernMemory, ModernStorage, ModernNetwork, ModernSystem, ModernContainers } from '../modern/modern.jsx';

import SmallExternalInputCard from '../smallCards/smallExternalInputCard.jsx';
import SmallTemperatureCard from '../smallCards/smallTemperatureCard.jsx';
import SmallBatteryCard from '../smallCards/smallBatteryCard.jsx';
import SmallRaspberryPiPowerCard from '../smallCards/smallRaspberryPiPowerCard.jsx';
import SmallStorageCard from '../smallCards/smallStorageCard.jsx';
import SmallMemoryCard from '../smallCards/smallMemoryCard.jsx';
import SmallNetworkCard from '../smallCards/smallNetworkCard.jsx';
import SmallProcessorCard from '../smallCards/smallProcessorCard.jsx';

const TEST_DATA = [];
const MAX_POINTS = 60;
const DashboardPanel = (props) => {
  const [data, setData] = useState(TEST_DATA);
  const [updateDataInterval, setUpdateDataInterval] = useState(1000);
  // const screenWidth = window.innerWidth;
  // console.log("屏幕宽度:", screenWidth);
  const location = useLocation();
  const isDashboardRoute = location.pathname.endsWith('/small');

  const updateData = async () => {
    let _data;
    if (props.peripherals.includes('history')) {
      // _data = await props.request("get-history", "GET", { n: 20 });
      _data = await props.request("get-data", "GET", { n: 20 });
    } else {
      _data = await props.request("get-data", "GET");
    }
    if (_data) {
      if (!Array.isArray(_data)) {
        if (!_data.time) {
          _data.time = new Date().getTime();
        }
        let newData = data.filter(d => Object.keys(d).length > 1);
        while (newData.length >= MAX_POINTS) {
          newData.pop();
        }
        // newData.push(_data);
        // Pironman 5 NAS数据往后走，所以使用pop和unshift
        newData.unshift(_data);
        setData(newData);
      } else {
        setData(_data);
      }
    }
  }

  // Seed charts with recent history so graphs are not empty on load
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded || !props.connected || !props.peripherals.includes('history')) return;
    setSeeded(true);
    (async () => {
      const hist = await props.request("get-history", "GET", { n: MAX_POINTS }, true);
      if (Array.isArray(hist) && hist.length > 0) {
        // API returns newest first, which matches this panel's ordering
        const sorted = [...hist].filter(d => d && Object.keys(d).length > 1)
          .sort((a, b) => new Date(b.time) - new Date(a.time));
        setData(prev => (prev.length > 0 ? [...prev, ...sorted].slice(0, MAX_POINTS) : sorted));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.connected, props.peripherals]);

  // 自动获取数据
  useEffect(() => {
    let interval;
    if (props.connected && props.peripherals.length > 0) {
      interval = setInterval(() => {
        updateData();
      }, updateDataInterval);
    }
    return () => clearInterval(interval);
  }, [updateDataInterval, props.connected, data, props.peripherals]);

  useEffect(() => {
    // if (data.length > 0) {
    //   props.onDataChange(data[data.length - 1])
    // }
    if (data.length > 0) {
      // 从最后一个元素开始查找
      let index = data.length - 1;
      let targetData;

      // 循环查找，直到找到不只有time属性的对象或遍历完所有元素
      while (index >= 0) {
        const current = data[index];
        // 检查当前对象的键数量是否大于1（不只time一个属性）
        if (Object.keys(current).length > 1) {
          targetData = current;
          break;
        }
        index--;
      }

      // 如果找到符合条件的对象则传递，否则使用最后一个（即使只有time）
      if (targetData) {
        props.onDataChange(targetData);
      } else {
        props.onDataChange(data[data.length - 1]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const bytesFormatter = (value, name, props) => {
    let unit = props.unit;
    if (unit === 'B' || unit === 'B/s') {
      value = formatBytes(value);
    } else {
      if (Array.isArray(value)) return;
      value = value.toFixed(2);
      value += ' ';
    }
    return value;
  };

  const cardMap = {
    input: {
      visible: () =>
        props.peripherals.includes('external_input') ||
        props.peripherals.includes('input_voltage') ||
        props.peripherals.includes('input_current') ||
        props.peripherals.includes('is_input_plugged_in'),
      render: () => (
        isDashboardRoute ?
          <SmallExternalInputCard
            data={data}
            bytesFormatter={bytesFormatter}
            switchShow={props.peripherals.includes('output_switch')}
          /> :
          <ExternalInputCard
            data={data}
            bytesFormatter={bytesFormatter}
            switchShow={props.peripherals.includes('output_switch')}
          />

      )
    },

    temperature: {
      visible: () =>
        props.peripherals.includes('pwm_fan_speed') ||
        props.peripherals.includes('cpu_temperature') ||
        props.peripherals.includes('gpu_temperature') ||
        props.peripherals.includes('temperature'),
      render: () => (
        isDashboardRoute ?
          <SmallTemperatureCard
            data={data}
            request={props.request}
            unit={props.temperatureUnit || "C"}
          /> :
<ModernTemperature data={data} unit={props.temperatureUnit || 'C'} />
      )
    },

    battery: {
      visible: () =>
        props.peripherals.includes('is_battery_plugged_in') ||
        props.peripherals.includes('battery_percentage') ||
        props.peripherals.includes('battery_capacity') ||
        props.peripherals.includes('battery_voltage') ||
        props.peripherals.includes('battery') ||
        props.peripherals.includes('battery_current'),
      render: () => isDashboardRoute ? <SmallBatteryCard data={data} /> : <BatteryCard data={data} />
    },

    pipower: {
      visible: () =>
        props.peripherals.includes('raspberry_pi_power') ||
        props.peripherals.includes('output_voltage') ||
        props.peripherals.includes('output_current') ||
        props.peripherals.includes('output_switch'),
      render: () => (
        isDashboardRoute ?
          <SmallRaspberryPiPowerCard
            data={data}
            sendData={props.sendData}
            peripherals={props.peripherals}
            showAlert={props.showAlert}
            showBanner={props.showBanner}
          /> :
          <RaspberryPiPowerCard
            data={data}
            sendData={props.sendData}
            peripherals={props.peripherals}
            showAlert={props.showAlert}
            showBanner={props.showBanner}
          />
      )
    },

    storage: {
      visible: () => props.peripherals.includes('storage'),
      render: () => (
        isDashboardRoute ?
          <SmallStorageCard
            data={data}
            mountSwitchChecked={props.mountSwitchChecked}
          /> :
<ModernStorage data={data} mountSwitchChecked={props.mountSwitchChecked} />
      )
    },

    memory: {
      visible: () => props.peripherals.includes('memory'),
      render: () => isDashboardRoute ? <SmallMemoryCard data={data} /> : <ModernMemory data={data} />
    },

    network: {
      visible: () => props.peripherals.includes('network'),
      render: () => isDashboardRoute ? <SmallNetworkCard data={data} /> : <ModernNetwork data={data} />
    },

    processor: {
      visible: () => props.peripherals.includes('cpu'),
      render: () => (
        isDashboardRoute ?
          <SmallProcessorCard
            data={data}
            processorChartAmount={props.processorChartAmount}
          /> :
<ModernProcessor data={data} />
      )
    }
  };

  return (<Box sx={{ width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
    <Panel title={props.deviceName} {...props}>
      {
        // screenWidth === 800 ?
        isDashboardRoute ?
          <Box Box sx={{ display: "flex", flexFlow: "wrap", gap: "4px", justifyContent: 'flex-start' }}>
            {props.cardLayout.map((key) => {
              const card = cardMap[key];
              if (!card || !card.visible()) return null;
              return card.render(key);
            })}
          </Box>
          :
          <div className="mgrid">
            {props.cardLayout.map((key) => {
              const card = cardMap[key];
              if (!card || !card.visible()) return null;
              return <React.Fragment key={key}>{card.render(key)}</React.Fragment>;
            })}
            <ModernSystem data={data} />
            <ModernContainers />
          </div>
      }
    </Panel >
  </Box >
  );
};

export default DashboardPanel;
