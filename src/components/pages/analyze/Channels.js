import React from 'react';
import Component from 'components/Component';
import style from 'styles/onboarding/onboarding.css';
import dashboardStyle from 'styles/dashboard/dashboard.css';
import Select from 'components/controls/Select';
import {getChannelsWithNicknames, getMetadata, getNickname as getChannelNickname} from 'components/utils/channels';
import {FeatureToggle} from 'react-feature-toggles';
import icons from 'styles/icons/plan.css';
import PerformanceGraph from 'components/pages/analyze/PerformanceGraph';
import {get} from 'lodash';
import AttributionTable from 'components/pages/analyze/AttributionTable';

export default class Channels extends Component {

  style = style;
  styles = [dashboardStyle, icons];

  constructor(props) {
    super(props);

    this.state = {
      attributionTableIndicator: 'MCL',
      conversionIndicator: 'MCL',
      attributionTableRevenueMetric: 'pipeline',
      sortBy: 'webVisits',
      isDesc: 1,
      firstObjective: 'SQL'
    };
  }

  initialize(props) {
    //set objective
    this.setState({firstObjective: props.calculatedData.objectives.firstObjective});
  }

  componentDidMount() {
    this.initialize(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.initialize(nextProps);
  }

  sortBy(param) {
    if (this.state.sortBy === param) {
      this.setState({isDesc: this.state.isDesc * -1});
    }
    else {
      this.setState({sortBy: param});
    }
  }

  render() {
    const {attributionModelLabel, attribution: {channelsImpact}, getMetricDataByMapping, calculatedData: {historyData: {sumBudgets, indicatorsDataPerMonth, months}}, metricsOptions} = this.props;
    const {firstObjective} = this.state;

    const getChannelTitle = ({value: channelKey, label}) => {
      return <div style={{display: 'flex'}}>
        <div className={dashboardStyle.locals.channelIcon} data-icon={'plan:' + channelKey}/>
        <div className={dashboardStyle.locals.channelTable}>
          {label}
        </div>
      </div>;
    };

    const getItemData = (item, dataKey) => {
      const {value: channelKey} = item;
      return get(channelsImpact, [dataKey, channelKey], 0);
    };

    const getChannelCost = (channel) => {
      return sumBudgets[channel.value] || 0;
    };

    const channelsArray = getChannelsWithNicknames();
    channelsArray.push({value: 'direct', label: 'Direct'});

    let channelsWithData = channelsArray.map(item => {
      const json = {
        channel: item.value,
        label: item.label,
        budget: sumBudgets[item.value] || 0,
        revenueMetric: (channelsImpact &&
          channelsImpact[this.state.attributionTableRevenueMetric] &&
          channelsImpact[this.state.attributionTableRevenueMetric][item.value])
          ? channelsImpact[this.state.attributionTableRevenueMetric][item.value]
          : 0,
        webVisits: (channelsImpact && channelsImpact['webVisits'] && channelsImpact['webVisits'][item.value])
          ? channelsImpact['webVisits'][item.value]
          : 0,
        conversion: (channelsImpact && channelsImpact['conversion'] && channelsImpact['conversion'][item.value])
          ? channelsImpact['conversion'][item.value]
          : 0,
        funnelIndicator: (channelsImpact &&
          channelsImpact[this.state.attributionTableIndicator] &&
          channelsImpact[this.state.attributionTableIndicator][item.value])
          ? channelsImpact[this.state.attributionTableIndicator][item.value]
          : 0
      };
      json.ROI = json.budget ? json.revenueMetric / json.budget : 0;
      json.CPX = json.budget / json.funnelIndicator;
      return json;
    });

    channelsWithData =
      channelsWithData.filter(
        item => item.funnelIndicator || item.conversion || item.webVisits || item.revenueMetric);

    const convIndicatorImpact = channelsImpact && channelsImpact[this.state.conversionIndicator];
    const fatherChannelsWithBudgets = [];
    let fatherChannelsSum = 0;
    convIndicatorImpact && Object.keys(convIndicatorImpact).forEach(channel => {
      const channelCategory = getMetadata('category', channel);
      if (channelCategory && convIndicatorImpact[channel]) {
        fatherChannelsSum += convIndicatorImpact[channel];
        const existsFather = fatherChannelsWithBudgets.find(item => item.name === channelCategory);
        if (existsFather) {
          existsFather.value += convIndicatorImpact[channel];
        }
        else {
          fatherChannelsWithBudgets.push({name: channelCategory, value: convIndicatorImpact[channel]});
        }
      }
    });

    const journeys = [];
    let journeysSum = 0;

    const metricData = getMetricDataByMapping(this.state.conversionIndicator);
    metricData.forEach(user => {
      const journey = user.sessions
        .filter(item => item.channel && item.channel !== 'direct' && Object.keys(item.funnelStages).includes(this.state.conversionIndicator))
        .map(item => item.channel);
      if (journey && journey.length > 0) {
        journeysSum++;
        const alreadyExists = journeys.find(item => item.channels.length === journey.length && item.channels.every((item, index) => item === journey[index]));
        if (alreadyExists) {
          alreadyExists.count++;
        }
        else {
          journeys.push({
            channels: journey,
            count: 1
          });
        }
      }
    });

    const journeysUI = journeys
      .sort((a, b) => b.count - a.count)
      .map((item, index) =>
        <div key={index} className={dashboardStyle.locals.journeyRow}>
          <div style={{width: '78%'}}>
            <div className={dashboardStyle.locals.journey}>
              {item.channels.map((channel, index) => {
                const channelNickname = getChannelNickname(channel);
                return <div className={dashboardStyle.locals.channelBox} key={index}>
                  <div className={dashboardStyle.locals.channelIcon} data-icon={'plan:' + channel}
                       style={{margin: '0 5px'}}/>
                  <div className={dashboardStyle.locals.channelText} data-tip={channelNickname} data-for='appTip'>
                    {channelNickname}
                  </div>
                </div>;
              })}
            </div>
          </div>
          <div>
            {item.count}
          </div>
          <div style={{marginLeft: '48px'}}>
            {Math.round(item.count / journeysSum * 100)}%
          </div>
        </div>
      );

    return <div>
      <div className={this.classes.wrap}>
        <div>
          <FeatureToggle featureName="attribution">
            <AttributionTable data={channelsArray}
                              getItemCost={getChannelCost}
                              dataNickname='Channel'
                              getItemTitle={getChannelTitle}
                              getItemData={getItemData}
                              attributionModel={attributionModelLabel}
            />
          </FeatureToggle>
          <FeatureToggle featureName="attribution">
            <div className={dashboardStyle.locals.item} style={{height: '387px', width: '1110px'}}>
              <div className={dashboardStyle.locals.text}>
                Top Conversion Journeys
              </div>
              <div style={{display: 'flex'}}>
                <div className={dashboardStyle.locals.conversionGoal}>
                  Choose a conversion goal
                  <Select
                    selected={this.state.conversionIndicator}
                    select={{
                      options: metricsOptions
                    }}
                    onChange={(e) => {
                      this.setState({conversionIndicator: e.value});
                    }}
                    style={{width: '143px', marginLeft: '10px'}}
                  />
                </div>
              </div>
              <div style={{position: 'relative', display: 'flex', padding: '10px 0', height: '275px'}}>
                <div style={{overflow: 'auto'}}>
                  {
                    fatherChannelsWithBudgets
                      .sort((a, b) => b.value - a.value)
                      .map((element, i) => (
                        <div key={i} className={dashboardStyle.locals.fatherChannelBox}>
                          <div className={dashboardStyle.locals.fatherChannelBoxFill}
                               style={{width: Math.round(element.value / fatherChannelsSum * 400) + 'px'}}/>
                          <div className={dashboardStyle.locals.fatherChannelTitle}>
                            {element.name}
                          </div>
                          <div className={dashboardStyle.locals.fatherChannelValue}>
                            {Math.round(element.value)} ({Math.round(element.value / fatherChannelsSum * 100)}%)
                          </div>
                        </div>
                      ))
                  }
                </div>
                <div className={dashboardStyle.locals.line}/>
                <div style={{width: '625px', marginLeft: '30px'}}>
                  <div style={{display: 'flex'}}>
                    <div style={{marginLeft: '75%'}}>
                      Conv
                    </div>
                    <div style={{marginLeft: '20px'}}>
                      % of Total
                    </div>
                  </div>
                  <div style={{overflowY: 'auto', height: '266px'}}>
                    {journeysUI}
                  </div>
                </div>
              </div>
            </div>
          </FeatureToggle>
        </div>
        <div>
          <PerformanceGraph isPast={true} months={months ? months.length : 1} data={indicatorsDataPerMonth}
                            defaultIndicator={firstObjective}/>
        </div>
      </div>
    </div>;
  }

  getTableRow(title, items, props) {
    return <tr {...props}>
      {title != null ?
        <td className={this.classes.titleCell}>{this.getCellItem(title)}</td>
        : null}
      {
        items.map((item, i) => {
          return <td className={this.classes.valueCell} key={i}>{
            this.getCellItem(item)
          }</td>;
        })
      }
    </tr>;
  }

  getCellItem(item) {
    let elem;

    if (typeof item !== 'object') {
      elem = <div className={this.classes.cellItem}>{item}</div>;
    }
    else {
      elem = item;
    }

    return elem;
  }

}