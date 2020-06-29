import React from 'react';
import Component from 'components/Component';
import style from 'styles/onboarding/onboarding.css';
import {
  XAxis,
  Tooltip,
  AreaChart,
  Area,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  BarChart,
  Bar,
  LabelList
} from 'recharts';
import dashboardStyle from 'styles/dashboard/dashboard.css';
import Select from 'components/controls/Select';
import {getIndicatorsWithNicknames} from 'components/utils/indicators';
import {formatBudget, formatBudgetShortened, formatNumber, formatNumberWithDecimalPoint} from 'components/utils/budget';
import {getChannelsWithProps, getMetadata, getNickname as getChannelNickname} from 'components/utils/channels';
import {getNickname as getIndicatorNickname} from 'components/utils/indicators';
import {flattenObjectives} from 'components/utils/objective';
import {getRawDatesSpecific} from 'components/utils/date';
import RechartBarLabel from 'components/controls/RechartBarLabel';
import {getColor} from 'components/utils/colors';
import sumBy from 'lodash/sumBy';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import {SmallTable} from 'components/controls/Table';
import indicatorsGraphStyle from 'styles/plan/indicators-graph.css';
import isEmpty from 'lodash/isEmpty';
import StatSquare from 'components/common/StatSquare';

const StatTable = (props) => (
  <SmallTable
    noPadding
    style={{
      maxHeight: 330,
      margin: '15px 0'
    }}
    headRowClassName={dashboardStyle.locals.itemTableHeader}
    cellClassName={dashboardStyle.locals.itemTableHeaderCell}
    {...props}
  />
);

export default class Overview extends Component {

  style = style;
  styles = [dashboardStyle, indicatorsGraphStyle];

  constructor(props) {
    super(props);

    this.state = {
      historicalPerformanceIndicator: 'SQL'
    };
  }

  getDateString(stringDate) {
    if (stringDate) {
      const monthNames = [
        'Jan', 'Feb', 'Mar',
        'Apr', 'May', 'Jun', 'Jul',
        'Aug', 'Sep', 'Oct',
        'Nov', 'Dec'
      ];
      const planDate = stringDate.split('/');
      const date = new Date(planDate[1], planDate[0] - 1);

      return monthNames[date.getMonth()] + '/' + date.getFullYear().toString().substr(2, 2);
    }

    return null;
  }

  getObjectiveFormattedDate(dueDate) {
    const monthNames = [
      'Jan', 'Feb', 'Mar',
      'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct',
      'Nov', 'Dec'
    ];
    return monthNames[dueDate.getMonth()] +
      '/' +
      dueDate.getDate() +
      '/' +
      dueDate.getFullYear().toString().substr(2, 2);
  }

  render() {
    const {totalRevenue, attribution: {channelsImpact, campaigns: attributionCampaigns, pages: attributionPages}, historyData: {objectives, indicators}, planDate, calculatedData: {historyData: {months, totalCost, historyDataWithCurrentMonth: {indicators: indicatorsWithCurrentMonth, actualIndicatorsDaily}}}} = this.props;
    const indicatorsOptions = getIndicatorsWithNicknames();
    const flattenHistoryObjectives = flattenObjectives(objectives,
      indicators,
      getRawDatesSpecific(planDate, objectives.length, 0),
      [], [],
      false);

    // Parse object to recharts format per indicator
    const indicatorsData = {};
    actualIndicatorsDaily.forEach((item, key) => {
      const monthString = months[key];
      item.forEach((month, index) => {
        const displayDate = index ? `${index + 1} ${monthString}` : monthString;
        month && Object.keys(month).forEach(indicator => {
          if (!indicatorsData[indicator]) {
            indicatorsData[indicator] = [];
          }
          const value = month[indicator];
          indicatorsData[indicator].push({name: displayDate, value: value > 0 ? value : 0});
        });
      });
    });

    let grow = 0;
    if (indicatorsData[this.state.historicalPerformanceIndicator]) {
      const current = indicatorsData[this.state.historicalPerformanceIndicator] &&
        indicatorsData[this.state.historicalPerformanceIndicator][indicatorsData[this.state.historicalPerformanceIndicator].length -
        1] &&
        indicatorsData[this.state.historicalPerformanceIndicator][indicatorsData[this.state.historicalPerformanceIndicator].length -
        1].value;
      const previous = indicatorsData[this.state.historicalPerformanceIndicator] &&
        indicatorsData[this.state.historicalPerformanceIndicator][(this.props.months !== undefined
          ? this.props.months
          : 0)] &&
        indicatorsData[this.state.historicalPerformanceIndicator][(this.props.months !== undefined
          ? this.props.months
          : 0)].value;
      if (current) {
        if (previous) {
          grow = Math.round((current - previous) / previous * 100);
        }
        else {
          grow = Infinity;
        }
      }
    }

    const totalPipeline = this.props.getTotalParam('pipeline');

    const revenueByChannel = channelsImpact ? channelsImpact.revenue : {};
    const influencedRevenueByChannel = channelsImpact ? channelsImpact.influencedRevenue : {};
    delete revenueByChannel.direct;

    const channelsByCategories = groupBy(Object.keys(revenueByChannel), channel => getMetadata('category', channel));
    const revenueByCategory = mapValues(channelsByCategories,
      channels => sumBy(channels, channel => revenueByChannel[channel]));
    const influencedRevenueByCategory = mapValues(channelsByCategories,
      channels => sumBy(channels, channel => influencedRevenueByChannel[channel]));
    const indicatorsInRelevantMonths = indicatorsWithCurrentMonth.slice(this.props.monthsExceptThisMonth);

    const channelCategoriesPerMonth = indicatorsInRelevantMonths.map((month) => {
      const mergedObject = {};
      const channelsWithProps = getChannelsWithProps();
      Object.keys(channelsWithProps).forEach(channel => {
        const totalValue = ((channelsImpact && channelsImpact.MCL && channelsImpact.MCL[channel]) ?
          channelsImpact.MCL[channel] *
          month.leadToAccountConversionRate /
          100 *
          month.LTV
          : 0)
          +
          ((channelsImpact && channelsImpact.MQL && channelsImpact.MQL[channel]) ?
            channelsImpact.MQL[channel] *
            month.MQLToSQLConversionRate /
            100 *
            month.SQLToOppConversionRate /
            100 *
            month.OppToAccountConversionRate /
            100 *
            month.LTV
            : 0)
          +
          ((channelsImpact && channelsImpact.SQL && channelsImpact.SQL[channel]) ?
            channelsImpact.SQL[channel] *
            month.SQLToOppConversionRate /
            100 *
            month.OppToAccountConversionRate /
            100 *
            month.LTV
            : 0);
        const channelCategory = getMetadata('category', channel);
        if (channelCategory && totalValue) {
          if (!mergedObject[channelCategory]) {
            mergedObject[channelCategory] = 0;
          }
          mergedObject[channelCategory] += Math.round(totalValue);
        }
      });
      return mergedObject;
    });

    const channelCategoriesForPeriod = channelCategoriesPerMonth.reduce((mergedObject, month) => {
      Object.keys(month).forEach(category => {
        if (!mergedObject[category]) {
          mergedObject[category] = 0;
        }
        mergedObject[category] += month[category];
      });
      return mergedObject;
    }, {});

    let channelCategoriesSum = 0;
    const channelCategories = Object.keys(channelCategoriesForPeriod).map(category => {
      channelCategoriesSum += channelCategoriesForPeriod[category];
      return {name: category, value: channelCategoriesForPeriod[category]};
    });

    const data = channelCategoriesPerMonth.map((month, index) => {

      month.name = months[index];
      return month;
    });

    const CustomizedLabel = ({x, y, index: monthIndex, 'data-key': channel, height, width}) => (
      <RechartBarLabel
        x={x}
        y={y}
        height={height}
        width={width}
        label={'$' + formatBudgetShortened(channelCategoriesPerMonth[monthIndex][channel])}
      />
    );

    const bars = channelCategoriesForPeriod && Object.keys(channelCategoriesForPeriod).map((channel, index) =>
      <Bar key={index} yAxisId="left" dataKey={channel} stackId="channels" fill={getColor(index)}
           isAnimationActive={false} onMouseEnter={() => {
        this.setState({activeIndex: index});
      }} onMouseLeave={() => {
        this.setState({activeIndex: void 0});
      }}>
        <LabelList data-key={channel} content={<CustomizedLabel/>}/>
      </Bar>
    );

    const newIndicatorMapping = {
      MCL: 'newMCL',
      MQL: 'newMQL',
      SQL: 'newSQL',
      opps: 'newOpps',
      users: 'newUsers'
    };

    const costPerFunnel = {};
    Object.keys(newIndicatorMapping).map(indicator => {
      const newIndicator = newIndicatorMapping[indicator];
      const indicatorSum = sumBy(indicatorsInRelevantMonths, item => item[newIndicator] || 0);
      costPerFunnel[indicator] = indicatorSum ? formatBudget(Math.round(totalCost / indicatorSum)) : '-';
    });

    const costPerX = Object.keys(costPerFunnel).map(indicator =>
      <StatSquare title={`Cost per ${getIndicatorNickname(indicator, true)}`}
                  stat={costPerFunnel[indicator]}
                  key={indicator}
      />
    );

    const getRevenueByTableItem = (title, revenueData, key) =>
      <div className={this.classes.colCenter} key={key}>
        <div className={dashboardStyle.locals.item}
             style={{display: 'inline-block', height: '412px', width: '540px', overflow: 'auto'}}>
          <div className={dashboardStyle.locals.text}>
            Revenue by {title}
          </div>
          <StatTable
            data={revenueData}
            columns={[
              {
                id: title,
                header: title,
                cell: 'title'
              },
              {
                id: 'Attributed Revenue',
                header: 'Attributed Revenue',
                cell: 'attributedRevenue'
              },
              {
                id: 'Touched Revenue',
                header: 'Touched Revenue',
                cell: 'touchedRevenue'
              }
            ]}
          />
        </div>
      </div>;

    const getRevenueByRow = data => {
      const items = data.map((dataItem, index) => getRevenueByTableItem(dataItem.title, dataItem.revenueData, index));
      return <div className={this.classes.cols} style={{width: '1110px'}}>
        {items}
      </div>;
    };

    const tooltip = (data) => {
      const {active, label, payload} = data;

      return (active && !isEmpty(payload) && payload[0]) ?
        <div className={indicatorsGraphStyle.locals.customTooltip}>
          <div className={indicatorsGraphStyle.locals.customTooltipIndicator}>
            {label}
          </div>
          <div className={indicatorsGraphStyle.locals.customTooltipObjective}>
            {getIndicatorNickname(this.state.historicalPerformanceIndicator)}: {formatNumber(payload[0].value)}
          </div>
        </div>
        : null;
    };

    return <div>
      <div className={this.classes.wrap}>
        <div>
          <div className={this.classes.cols} style={{width: '825px'}}>
            <StatSquare
              title="Total Cost"
              stat={`$${formatBudgetShortened(totalCost)}`}
            />
            <StatSquare
              title="Total Pipeline Revenue"
              stat={`$${formatBudgetShortened(totalPipeline)}`}
            />
            <StatSquare
              title="Pipeline ROI"
              stat={formatNumberWithDecimalPoint(totalPipeline / totalCost)}
            />
            <StatSquare
              title="Total Revenue"
              stat={`$${formatBudgetShortened(totalRevenue)}`}
            />
            <StatSquare
              title="Revenue ROI"
              stat={`${formatNumberWithDecimalPoint(totalRevenue / totalCost)}X`}
            />
          </div>
          <div className={this.classes.cols} style={{width: '825px'}}>
            {costPerX}
          </div>
          <div className={this.classes.cols}>
            <div className={this.classes.colLeft}>
              <div className={dashboardStyle.locals.item} style={{height: '387px', width: '1110px'}}>
                <div className={dashboardStyle.locals.text}
                     data-tip="(Estimated) Impact across funnel. Sum of each funnel stage X the likability to convert to a paying account X estimated LTV."
                     data-for='appTip'>
                  Marketing-Generated Business Impact
                </div>
                <div style={{display: 'flex'}}>
                  <div className={dashboardStyle.locals.chart} style={{width: '443px', alignItems: 'center'}}>
                    <div className={this.classes.footerLeft} style={{zIndex: 2}}>
                      <div className={dashboardStyle.locals.index}>
                        {
                          channelCategories.map((element, i) => (
                            <div key={i} style={{display: 'flex', marginTop: '5px'}}>
                              <div style={{
                                border: '2px solid ' + getColor(i),
                                borderRadius: '50%',
                                height: '8px',
                                width: '8px',
                                display: 'inline-flex',
                                marginTop: '2px',
                                backgroundColor: this.state.activeIndex === i ? getColor(i) : 'initial'
                              }}/>
                              <div style={{
                                fontWeight: this.state.activeIndex === i ? 'bold' : 'initial',
                                display: 'inline',
                                paddingLeft: '4px',
                                fontSize: '14px',
                                width: '100px',
                                textTransform: 'capitalize'
                              }}>
                                {element.name}
                              </div>
                              <div style={{fontSize: '14px', fontWeight: '600', width: '30px'}}
                                   data-tip={'$' + formatBudgetShortened(element.value)}
                                   data-for='appTip'>
                                {Math.round(element.value / channelCategoriesSum * 100)}%
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    <div className={this.classes.footerRight}
                         style={{width: '274px', marginLeft: '-25px'}}>
                      <PieChart width={274} height={332} onMouseEnter={(d, i) => {
                        this.setState({activeIndex: i});
                      }} onMouseLeave={() => {
                        this.setState({activeIndex: void 0});
                      }}>
                        <Pie
                          data={channelCategories}
                          dataKey="value"
                          cx='50%'
                          cy='50%'
                          labelLine={true}
                          innerRadius={75}
                          outerRadius={100}
                          isAnimationActive={false}
                        >
                          {
                            channelCategories.map((entry, index) => <Cell fill={getColor(index)}
                                                                          key={index}/>)
                          }
                        </Pie>
                      </PieChart>
                    </div>
                  </div>
                  <div className={dashboardStyle.locals.line} style={{left: '443px', bottom: '17px', height: '80%'}}/>
                  <div style={{marginLeft: '33px'}}>
                    <BarChart width={700} height={350} data={data} maxBarSize={85}>
                      <CartesianGrid vertical={false} horizontal={false}/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false}/>
                      <YAxis yAxisId="left" axisLine={false} tickLine={false}
                             tickFormatter={v => '$' + formatBudgetShortened(v)}/>
                      {bars}
                    </BarChart>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {getRevenueByRow([{
            title: 'Category',
            revenueData: Object.keys(revenueByCategory).map((category) => ({
              title: category.toUpperCase(),
              attributedRevenue: formatBudget(revenueByCategory[category]),
              touchedRevenue: formatBudget(influencedRevenueByCategory[category])
            }))
          }, {
            title: 'Channel',
            revenueData: Object.keys(revenueByChannel).map((channel) => ({
              title: getChannelNickname(channel),
              attributedRevenue: formatBudget(revenueByChannel[channel]),
              touchedRevenue: formatBudget(influencedRevenueByChannel[channel])
            }))
          }])}
          {getRevenueByRow([{
            title: 'Campaign',
            revenueData: attributionCampaigns
              .filter(campaign => campaign.revenue || campaign.influencedRevenue)
              .map((campaign) => ({
                title: campaign.name,
                attributedRevenue: formatBudget(campaign.revenue),
                touchedRevenue: formatBudget(campaign.influencedRevenue)
              }))
          }, {
            title: 'Content',
            revenueData: attributionPages.map((page) => ({
              title: page.title,
              attributedRevenue: formatBudget(page.revenue),
              touchedRevenue: formatBudget(page.influencedRevenue)
            }))
          }])}
          <div className={this.classes.cols} style={{width: '1110px'}}>
            <div className={this.classes.colLeft}>
              <div className={dashboardStyle.locals.item}
                   style={{display: 'inline-block', height: '412px', width: '540px'}}>
                <div className={dashboardStyle.locals.text}>
                  Historical Performance
                </div>
                <div style={{display: 'flex', marginTop: '7px'}}>
                  <div className={this.classes.footerLeft}>
                    <div className={dashboardStyle.locals.historyConfig}>
                      <div className={dashboardStyle.locals.historyConfigText}>
                        Show
                      </div>
                      <Select selected={this.state.historicalPerformanceIndicator}
                              select={{
                                options: indicatorsOptions
                              }}
                              onChange={(e) => {
                                this.setState({historicalPerformanceIndicator: e.value});
                              }}
                              style={{width: '172px', marginLeft: '8px'}}
                      />
                    </div>
                  </div>
                  {grow ?
                    <div className={this.classes.footerRight}>
                      <div className={dashboardStyle.locals.historyArrow} data-decline={grow < 0 ? true : null}/>
                      <div className={dashboardStyle.locals.historyGrow} data-decline={grow < 0 ? true : null}>
                        {isFinite(grow) ? Math.abs(grow) + '%' : '∞'}
                      </div>
                    </div>
                    : null}
                </div>
                <div className={dashboardStyle.locals.chart}>
                  <AreaChart width={540} height={280}
                             data={indicatorsData[this.state.historicalPerformanceIndicator]
                               ? indicatorsData[this.state.historicalPerformanceIndicator].slice(this.props.months)
                               : []}
                             style={{marginLeft: '-21px'}}>
                    <XAxis dataKey="name" style={{fontSize: '12px', color: '#354052', opacity: '0.5'}} ticks={months}/>
                    <YAxis style={{fontSize: '12px', color: '#354052', opacity: '0.5'}}/>
                    <CartesianGrid vertical={false}/>
                    <Tooltip content={tooltip}/>
                    <Area type='monotone' dataKey='value' stroke='#6BCCFF' fill='#DFECF7' strokeWidth={3}/>
                  </AreaChart>
                </div>
              </div>
            </div>
            <div className={this.classes.colRight}>
              <div className={dashboardStyle.locals.item} style={{
                height: '412px',
                width: '540px',
                overflow: 'auto'
              }}>
                <div className={dashboardStyle.locals.text}>
                  Objectives - planned vs actual
                </div>
                <StatTable
                  data={flattenHistoryObjectives}
                  columns={[
                    {
                      id: 'Objective',
                      header: 'Objective',
                      cell: ({indicator}) => getIndicatorNickname(indicator),
                      minWidth: 100
                    },
                    {
                      id: 'Date',
                      header: 'Date',
                      cell: ({dueDate}) => this.getObjectiveFormattedDate(dueDate)
                    },
                    {
                      id: 'Target',
                      header: 'Target',
                      cell: ({target}) => target
                    },
                    {
                      id: 'Actual',
                      header: 'Actual',
                      cell: ({value}) => value
                    },
                    {
                      id: 'Delta',
                      header: 'Delta',
                      cell: ({value, target}) => {
                        const grow = Math.round(value - target);

                        return (
                          <div>
                            {grow ?
                              <div style={{display: 'flex'}}>
                                <div className={dashboardStyle.locals.historyArrow}
                                     data-decline={grow < 0 ? true : null}/>
                                <div className={dashboardStyle.locals.historyGrow} data-decline={grow < 0 ? true : null}
                                     style={{marginRight: '0'}}>
                                  {Math.abs(grow)}
                                </div>
                              </div>
                              :
                              <div className={dashboardStyle.locals.checkMark}/>
                            }
                          </div>
                        );
                      }
                    }
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }
}
