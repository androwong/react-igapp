import React from "react";
import Component from "components/Component";
import dashboardStyle from "styles/dashboard/dashboard.css";
import {ComposedChart, CartesianGrid, XAxis, YAxis, Line, Bar, LabelList} from 'recharts';
import { formatBudgetShortened } from 'components/utils/budget';
import { getIndicatorsWithProps, getNickname as getIndicatorNickname } from 'components/utils/indicators';
import { getChannelsWithProps, getNickname as getChannelNickname } from 'components/utils/channels';
import PlanPopup, {
  TextContent as PopupTextContent
} from 'components/pages/plan/Popup';
import RechartBarLabel from 'components/controls/RechartBarLabel';
import remove from 'lodash/remove';
import {getColor} from 'components/utils/colors';

export default class PerformanceGraph extends Component {

  constructor() {
    super();

    this.state = {
      advancedIndicator: 'SQL',
      advancedChannels: ['total']
    };
  }

  componentDidMount() {
    this.setState({advancedIndicator: this.props.defaultIndicator});
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.defaultIndicator !== this.props.defaultIndicator) {
      this.setState({advancedIndicator: nextProps.defaultIndicator});
    }
  }

  changeIndicatorsSettings(indicator) {
    this.setState({advancedIndicator: indicator});
  }

  changeChannelsSettings(channel) {
    const advancedChannels = this.state.advancedChannels.slice();
    if (advancedChannels.includes('total')) {
      this.setState({advancedChannels: [channel]});
    }
    else if (channel === 'total') {
      this.setState({advancedChannels: ['total']});
    }
    else {
      const removed = remove(advancedChannels, (item) => item === channel);

      if (!removed || removed.length === 0) {
        if (advancedChannels.length < 3) {
          advancedChannels.push(channel);
        }
      }

      this.setState({advancedChannels: advancedChannels});
    }
  }

  render() {
    const { advancedIndicator, advancedChannels } = this.state;
    const { isPast, months, data } = this.props;

    const indicatorsProperties = getIndicatorsWithProps();
    const settingsIndicators = Object.keys(indicatorsProperties)
      .filter(indicator => !!data.find(month => month[indicator]))
      .map(indicator => <div key={indicator} className={dashboardStyle.locals.checkbox}>
        <input type="checkbox" onChange={ this.changeIndicatorsSettings.bind(this, indicator) } checked={ indicator === advancedIndicator } style={{  }}/>
        <div>{indicatorsProperties[indicator].nickname}</div>
      </div>);

    const channelsProperties = getChannelsWithProps();
    const settingsChannels = Object.keys(channelsProperties)
      .filter(channel => !!data.find(month => month[channel]))
      .map(channel => <div key={channel} className={dashboardStyle.locals.checkbox}>
        <input type="checkbox" onChange={ this.changeChannelsSettings.bind(this, channel) } checked={ advancedChannels.includes(channel) } style={{  }}/>
        <div>{channelsProperties[channel].nickname}</div>
      </div>);

    const CustomizedLabel = ({x, y, width, height, "data-key": channel, index: monthIndex}) => (
      <RechartBarLabel
        x={x}
        y={y}
        width={width}
        height={height}
        label={'$' + formatBudgetShortened(data[monthIndex][channel])}
      />
    );

    const bars = advancedChannels.map((channel, index) =>
      <Bar key={index} yAxisId="left" dataKey={channel} stackId="channels" fill={getColor(index)}>
        <LabelList data-key={channel} content={<CustomizedLabel/>}/>
      </Bar>
    );

    const graphChannels = advancedChannels.map((channel, index) =>
      <div key={index} style={{ borderBottom: '6px solid ' + getColor(index), marginRight: '25px', paddingBottom: '3px' }}>
        {channel === 'total' ? 'Total' : getChannelNickname(channel)}
      </div>);

    return <div className={dashboardStyle.locals.item}
                style={{height: '350px', width: '1110px', padding: '5px 15px', fontSize: '13px'}} data-id="analysis">
      <div className={dashboardStyle.locals.columnHeader}>
        <div className={dashboardStyle.locals.timeText}>
          {isPast ? 'Last' : 'Next'} {months} {`Month${months > 1 ? "s" : ""}`}
        </div>
        <div className={dashboardStyle.locals.text}>
          {isPast ? 'Past' : 'Future'} Spend & Impact
        </div>
        <div style={{position: 'relative'}}>
          <div className={dashboardStyle.locals.settings} onClick={() => {
            this.refs.advancedSettingsPopup.open()
          }}/>
          <PlanPopup ref="advancedSettingsPopup" style={{
            width: 'max-content',
            top: '20px',
            left: '-600px',
            height: '270px'
          }} title="Settings">
            <PopupTextContent>
              <div style={{display: 'flex'}}>
                <div style={{width: '50%', height: '220px', overflowY: 'auto', display: 'grid'}}>
                  {settingsIndicators}
                </div>
                <div style={{width: '50%', height: '220px', overflowY: 'auto', display: 'grid'}}>
                  <div className={dashboardStyle.locals.checkbox}>
                    <input type="checkbox" onChange={this.changeChannelsSettings.bind(this, 'total')}
                           checked={advancedChannels.includes('total')} style={{}}/>
                    <div>Total</div>
                  </div>
                  {settingsChannels}
                </div>
              </div>
            </PopupTextContent>
          </PlanPopup>
        </div>
      </div>
      <div>
        <ComposedChart width={1110} height={260} data={data} maxBarSize={85}
                       margin={{top: 20, right: 30, left: 20, bottom: 5}}>
          <CartesianGrid vertical={false}/>
          <XAxis dataKey="name" tickLine={false}/>
          <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={v => '$' + formatBudgetShortened(v)}/>
          <YAxis yAxisId="right" axisLine={false} tickLine={false} tickFormatter={formatBudgetShortened}
                 orientation="right"/>
          {bars}
          <Line yAxisId="right" type='monotone' dataKey={advancedIndicator} stroke="#f5a623" fill="#f5a623"
                strokeWidth={3}/>
        </ComposedChart>
      </div>
      <div style={{ position: 'relative', marginTop: '-5px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ marginRight: '50px' }}>
          <div className={dashboardStyle.locals.graphMetricsTitle}>
            Metrics
          </div>
          <div className={dashboardStyle.locals.graphIndicator}>
            {getIndicatorNickname(advancedIndicator)}
          </div>
        </div>
        <div>
          <div className={dashboardStyle.locals.graphSpendTitle}>
            Spend
          </div>
          <div className={dashboardStyle.locals.graphChannel}>
            {graphChannels}
          </div>
        </div>
      </div>
    </div>
  }
}