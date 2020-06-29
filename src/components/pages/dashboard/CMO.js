import React from 'react';
import Component from 'components/Component';
import style from 'styles/onboarding/onboarding.css';
import {PieChart, Pie, Cell} from 'recharts';
import dashboardStyle from 'styles/dashboard/dashboard.css';
import Objective from 'components/pages/dashboard/Objective';
import {
  getIndicatorsWithProps,
  getNickname as getIndicatorNickname} from 'components/utils/indicators';
import {getChannelsWithProps, getMetadata as getChannelMetadata} from 'components/utils/channels';
import {formatNumber, formatBudgetShortened} from 'components/utils/budget';
import CampaignsByFocus from 'components/pages/dashboard/CampaignsByFocus';
import merge from 'lodash/merge';
import {getDates} from 'components/utils/date';
import PerformanceGraph from 'components/pages/analyze/PerformanceGraph';
import TopX from 'components/pages/dashboard/TopX';
import DashboardStatWithContext from 'components/pages/dashboard/DashboardStatWithContext.js';
import MonthsPopup from 'components/pages/dashboard/MonthsPopup';
import {getExtarpolateRatio} from 'components/utils/utils';
import sumBy from 'lodash/sumBy';
import {getPlanBudgetsData} from 'components/utils/budget';
import {getColor} from 'components/utils/colors';
import {projectObjective} from 'components/utils/objective';

export default class CMO extends Component {

  style = style;
  styles = [dashboardStyle];

  static defaultProps = {
    actualIndicators: {
      MCL: 0,
      MQL: 0,
      SQL: 0,
      opps: 0,
      users: 0
    },
    unfilteredCampaigns: {},
    objectives: [],
    annualBudgetArray: []
  };

  constructor() {
    super();

    this.state = {
      activeIndex: void 0
    };
  }

  initialize(props) {
    if (this.state.months === undefined && props.historyData) {
      this.setState({months: props.calculatedData.historyData.historyDataLength});
    }
  }

  componentDidMount() {
    this.initialize(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.initialize(nextProps);
  }

  onPieEnter = (data, index) => {
    this.setState({
      activeIndex: index
    });
  };

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

  handleMonthsChange = (months) => this.setState({months});

  render() {
    const {
      planDate, historyData, actualIndicators, campaigns, planUnknownChannels, attribution: {channelsImpact, campaigns: attributionCampaigns, pages},
      calculatedData: {
        committedBudgets,
        committedForecasting,
        objectives: {firstObjective, funnelObjectives, collapsedObjectives, funnelFirstObjective},
        annualBudget, annualBudgetLeftToPlan, monthlyBudget, monthlyBudgetLeftToInvest, monthlyExtarpolatedMoneySpent, monthlyExtapolatedTotalSpending,
        historyData: {totalCost, historyDataWithCurrentMonth, indicatorsDataPerMonth, historyDataLength}
      }
    } = this.props;

    const {months, isPast, showAdvanced} = this.state;
    const merged = merge(committedBudgets, planUnknownChannels);
    const fatherChannelsWithBudgets = [];
    Object.keys(merged && merged[0])
      .filter(channel => merged[0][channel])
      .forEach(channel => {
        const category = getChannelMetadata('category', channel);
        const alreadyExistItem = fatherChannelsWithBudgets.find(item => item.name === category);
        if (!alreadyExistItem) {
          fatherChannelsWithBudgets.push({name: category, value: merged[0][channel]});
        }
        else {
          alreadyExistItem.value += merged[0][channel];
        }
      });

    const numberOfActiveCampaigns = campaigns
      .filter(campaign => campaign.isArchived !== true && campaign.status !== 'Completed').length;

    const monthlyOnTrackSpending = monthlyBudget * getExtarpolateRatio(new Date(), planDate);
    const isOnTrack = Math.abs(monthlyOnTrackSpending - monthlyExtarpolatedMoneySpent) < monthlyOnTrackSpending * 0.07;

    const ratioCalc = (LTV, CAC) => (LTV / CAC).toFixed(2) || 0;
    const ratioCanBeCalculated = (actualIndicators) => (actualIndicators &&
      actualIndicators.LTV !==
      0 &&
      actualIndicators.CAC !==
      0);
    const previousMonthData = (historyDataLength > 1)
      ? {actualIndicators: {...historyData.indicators[historyDataLength - 1]}}
      : {actualIndicators: {LTV: 0, CAC: 0}};
    const ratio = ratioCanBeCalculated(actualIndicators) ? ratioCalc(actualIndicators.LTV, actualIndicators.CAC) : null;
    const lastMonthRatio = ratioCanBeCalculated(previousMonthData.actualIndicators)
      ? ratioCalc(previousMonthData.actualIndicators.LTV, previousMonthData.actualIndicators.CAC)
      : null;
    const ratioContextStat = (ratio && lastMonthRatio) ? Math.round((ratio / lastMonthRatio) * 100) - 100 : null;

    const funnel = [];
    if (actualIndicators.MCL !== -2) {
      funnel.push({name: 'Leads', value: actualIndicators.MCL});
    }
    if (actualIndicators.MQL !== -2) {
      funnel.push({name: 'MQL', value: actualIndicators.MQL});
    }
    if (actualIndicators.SQL !== -2) {
      funnel.push({name: 'SQL', value: actualIndicators.SQL});
    }
    if (actualIndicators.opps !== -2) {
      funnel.push({name: 'Opps', value: actualIndicators.opps});
    }

    const funnelRatios = [];
    for (let i = 0; i < funnel.length - 1; i++) {
      funnelRatios.push({
        name: funnel[i].name + ':' + funnel[i + 1].name,
        value: funnel[i + 1].value / funnel[i].value
      });
    }

    const indicatorsProperties = getIndicatorsWithProps();
    const objectivesGauges = collapsedObjectives.map((objective, index) => {
      const target = objective.target;

      const project = projectObjective(committedForecasting, objective);

      return <Objective
        target={target}
        value={objective.value}
        title={indicatorsProperties[objective.indicator].nickname}
        project={project}
        key={index}
        directionDown={!indicatorsProperties[objective.indicator].isDirectionUp}
        timeFrame={objective.dueDate}
        color={getColor(index)}
        indicator={objective.indicator}
      />;
    });

    const futureBudget = committedBudgets.slice(0, months)
      .reduce((sum, month) => Object.keys(month).reduce((monthSum, channel) => month[channel] + monthSum, 0) + sum, 0);
    const futureLTV = committedForecasting.slice(0, months).reduce((sum, item) => sum + item.LTV, 0);
    const furureObjective = committedForecasting.slice(0, months)
      .reduce((sum, item) => sum + item[funnelFirstObjective], 0);

    const sumLTV = (indicators) => sumBy(indicators, (month) => month.LTV);
    const sumObjective = (indicators) => sumBy(indicators, (month) => month[funnelFirstObjective]);

    const pastLTV = sumLTV(historyDataWithCurrentMonth.indicators);
    const pastObjective = sumObjective(historyDataWithCurrentMonth.indicators);

    const relativePastData = {};
    Object.keys(historyData).forEach((key) => {
      relativePastData[key] = historyData[key].slice(historyDataLength - (2 * months), historyDataLength - months);
    });

    const {totalCost: relativePastBudget} = getPlanBudgetsData(relativePastData.planBudgets);

    const relativePastLTV = relativePastData && sumLTV(relativePastData);
    const relativePastObjective = relativePastData && sumObjective(relativePastData);

    const futureDates = getDates(this.props.planDate);

    const weights = {
      newMCL: 1,
      newMQL: 1,
      newSQL: 1,
      newOpps: 1,
      newUsers: 1
    };

    Object.keys(weights).forEach(indicator => {
      const objectiveIndex = funnelObjectives.findIndex(function (objective) {
        return objective === indicator;
      });
      switch (objectiveIndex) {
        case 0:
          weights[indicator] = 2;
          break;
        case 1:
          weights[indicator] = 1.5;
          break;
        case 2:
          weights[indicator] = 1.25;
          break;
      }
    });

    const channelsWithProps = getChannelsWithProps();
    const topChannels = Object.keys(channelsWithProps).map(channel => {
      const score = Math.round(
        ((channelsImpact && channelsImpact.MCL && channelsImpact.MCL[channel]) ? channelsImpact.MCL[channel] *
          weights.newMCL : 0)
        +
        ((channelsImpact && channelsImpact.MQL && channelsImpact.MQL[channel]) ? channelsImpact.MQL[channel] *
          weights.newMQL : 0)
        +
        ((channelsImpact && channelsImpact.SQL && channelsImpact.SQL[channel]) ? channelsImpact.SQL[channel] *
          weights.newSQL : 0)
        +
        ((channelsImpact && channelsImpact.opps && channelsImpact.opps[channel]) ? channelsImpact.opps[channel] *
          weights.newOpps : 0)
        +
        ((channelsImpact && channelsImpact.users && channelsImpact.users[channel]) ? channelsImpact.users[channel] *
          weights.newUsers : 0)
      );
      return {title: channelsWithProps[channel].nickname, score: score, icon: 'plan:' + channel};
    });

    const topCampaigns = attributionCampaigns ? attributionCampaigns.map(campaignData => {
      const score = Math.round(campaignData.MCL * weights.newMCL
        + campaignData.MQL * weights.newMQL
        + campaignData.SQL * weights.newSQL
        + campaignData.opps * weights.newOpps
        + campaignData.users * weights.newUsers);
      return {
        title: campaignData.name,
        score: score,
        icon: campaignData.channels.length > 0 ? campaignData.channels.length === 1
          ? 'plan:' + campaignData.channels[0]
          : 'plan:multiChannel' : null
      };
    }) : [];

    const topContent = pages.map(item => {
      const score = Math.round(item.MCL * weights.newMCL
        + item.MQL * weights.newMQL
        + item.SQL * weights.newSQL
        + item.opps * weights.newOpps
        + item.users * weights.newUsers);
      return {title: item.title, score: score, icon: 'plan:' + item.channel};
    });

    const data = isPast ? indicatorsDataPerMonth
      :
      committedBudgets.slice(0, months + 1).map((month, index) => {
        const json = {
          name: futureDates[index]
        };
        Object.keys(month).forEach(channel => {
          json[channel] = month[channel];
        });

        json['total'] = Object.keys(month).reduce((sum, channel) =>
          sum + month[channel], 0);

        Object.keys(committedForecasting[index]).forEach(indicator => {
          json[indicator] = committedForecasting[index][indicator];
        });
        return json;
      });

    const calcConvRate = ((funnelStage1, funnelStage2) => {
      if (funnelStage2 && funnelStage1) {
        return Math.round(funnelStage2 / funnelStage1 * 100);
      }
      return 0;
    });

    const getCohortTooltip = (firstFunnelStage, secondFunnelStage, value) => `Cohort-based ${getIndicatorNickname(firstFunnelStage, true)} to ${getIndicatorNickname(secondFunnelStage, true)} Conv. Rate - ${value}%`;

    return <div className={dashboardStyle.locals.wrap}>
      <div className={this.classes.cols}>
        <div className={this.classes.colLeft}>
          <div className={dashboardStyle.locals.item}
               style={{height: '300px', width: '1110px', display: 'flex', padding: '12px', overflow: 'visible'}}>
            <div className={dashboardStyle.locals.column} data-border={true}
                 data-selected={(showAdvanced && isPast) ? true : null}>
              <div className={dashboardStyle.locals.columnHeader}>
                <div className={dashboardStyle.locals.timeText}>
                  Last {months} Months
                </div>
                <div className={dashboardStyle.locals.text} style={{borderBottom: 'none'}}>
                  Past
                </div>
                <div className={dashboardStyle.locals.advanced} onClick={() => {
                  this.setState({showAdvanced: !showAdvanced, isPast: true});
                }}/>
                <div style={{position: 'relative'}}>
                  <div className={dashboardStyle.locals.settings} onClick={() => {
                    this.pastSettingsPopup.open();
                  }}/>
                  {months !== undefined && (
                    <MonthsPopup
                      months={months}
                      maxMonths={historyDataLength}
                      onChange={this.handleMonthsChange}
                      getRef={ref => this.pastSettingsPopup = ref}
                      style={{width: 'max-content', top: '20px', left: '-110px'}}
                    />
                  )}
                </div>
              </div>
              <div style={{marginTop: '18px'}}>
                <div className={dashboardStyle.locals.quarter1}>
                  <div className={dashboardStyle.locals.quarterNumber}>
                    {Math.round(pastLTV / totalCost * 100)}%
                    <div className={dashboardStyle.locals.center} style={{
                      visibility: (relativePastBudget &&
                        isFinite(relativePastBudget) &&
                        relativePastLTV &&
                        isFinite(relativePastLTV) &&
                        ((pastLTV / totalCost) / (relativePastLTV / relativePastBudget) - 1)) ? 'visible' : 'hidden'
                    }}>
                      <div className={dashboardStyle.locals.historyArrow}
                           data-decline={((pastLTV / totalCost) / (relativePastLTV / relativePastBudget) - 1) < 0
                             ? true
                             : null}/>
                      <div className={dashboardStyle.locals.historyGrow}
                           data-decline={((pastLTV / totalCost) / (relativePastLTV / relativePastBudget) - 1) < 0
                             ? true
                             : null} style={{marginRight: '0'}}>
                        {Math.round(((pastLTV / totalCost) / (relativePastLTV / relativePastBudget) - 1) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className={dashboardStyle.locals.quarterText}>
                    ROI
                  </div>
                </div>
                <div className={dashboardStyle.locals.quarter2}>
                  <div className={dashboardStyle.locals.quarterNumber}>
                    ${formatBudgetShortened(totalCost)}
                    <div className={dashboardStyle.locals.center} style={{
                      visibility: (relativePastBudget &&
                        isFinite(relativePastBudget) &&
                        (totalCost / relativePastBudget - 1)) ? 'visible' : 'hidden'
                    }}>
                      <div className={dashboardStyle.locals.historyArrow}
                           data-decline={(totalCost / relativePastBudget - 1) < 0 ? true : null}/>
                      <div className={dashboardStyle.locals.historyGrow}
                           data-decline={(totalCost / relativePastBudget - 1) < 0 ? true : null}
                           style={{marginRight: '0'}}>
                        {Math.round((totalCost / relativePastBudget - 1) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className={dashboardStyle.locals.quarterText}>
                    Spend
                  </div>
                </div>
                <div className={dashboardStyle.locals.quarter3}>
                  <div className={dashboardStyle.locals.quarterNumber}>
                    ${formatBudgetShortened(pastLTV)}
                    <div className={dashboardStyle.locals.center} style={{
                      visibility: (relativePastLTV &&
                        isFinite(relativePastLTV) &&
                        (pastLTV / relativePastLTV - 1)) ? 'visible' : 'hidden'
                    }}>
                      <div className={dashboardStyle.locals.historyArrow}
                           data-decline={(pastLTV / relativePastLTV - 1) < 0 ? true : null}/>
                      <div className={dashboardStyle.locals.historyGrow}
                           data-decline={(pastLTV / relativePastLTV - 1) < 0 ? true : null} style={{marginRight: '0'}}>
                        {Math.round((pastLTV / relativePastLTV - 1) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className={dashboardStyle.locals.quarterText}>
                    LTV
                  </div>
                </div>
                <div className={dashboardStyle.locals.quarter4}>
                  <div className={dashboardStyle.locals.quarterNumber}>
                    {formatBudgetShortened(pastObjective)}
                    <div className={dashboardStyle.locals.center} style={{
                      visibility: (relativePastObjective &&
                        isFinite(relativePastObjective) &&
                        (pastObjective / relativePastObjective - 1)) ? 'visible' : 'hidden'
                    }}>
                      <div className={dashboardStyle.locals.historyArrow}
                           data-decline={(pastObjective / relativePastObjective - 1) < 0 ? true : null}/>
                      <div className={dashboardStyle.locals.historyGrow}
                           data-decline={(pastObjective / relativePastObjective - 1) < 0 ? true : null}
                           style={{marginRight: '0'}}>
                        {Math.round((pastObjective / relativePastObjective - 1) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className={dashboardStyle.locals.quarterText}>
                    {getIndicatorNickname(funnelFirstObjective)}
                  </div>
                </div>
              </div>
            </div>
            <div className={dashboardStyle.locals.column} data-border={true}>
              <div className={dashboardStyle.locals.text}>
                This Month
              </div>
              <div style={{padding: '15px'}}>
                <div className={dashboardStyle.locals.miniFunnelRow}>
                  <div className={dashboardStyle.locals.miniFunnelText}>
                    {getIndicatorNickname('MCL')}
                  </div>
                  <div className={dashboardStyle.locals.miniFunnelStageContainer}>
                    <div className={dashboardStyle.locals.miniFunnelMcl}>
                      {actualIndicators.newMCL}
                    </div>
                    <div className={dashboardStyle.locals.miniFunnelConv}
                         style={{left: '157px'}}
                         data-tip={getCohortTooltip('MCL', 'MQL', actualIndicators.leadToMQLConversionRate)}
                         data-for="appTip">
                      <div className={dashboardStyle.locals.curvedArrow}/>
                      {calcConvRate(actualIndicators.newMCL, actualIndicators.newMQL)}%
                    </div>
                  </div>
                </div>
                <div className={dashboardStyle.locals.miniFunnelRow}>
                  <div className={dashboardStyle.locals.miniFunnelText}>
                    {getIndicatorNickname('MQL')}
                  </div>
                  <div className={dashboardStyle.locals.miniFunnelStageContainer}>
                    <div className={dashboardStyle.locals.miniFunnelMql}>
                      {actualIndicators.newMQL}
                    </div>
                    <div className={dashboardStyle.locals.miniFunnelConv}
                         style={{left: '142px'}}
                         data-tip={getCohortTooltip('MQL', 'SQL', actualIndicators.MQLToSQLConversionRate)}
                         data-for="appTip">
                      <div className={dashboardStyle.locals.curvedArrow}/>
                      {calcConvRate(actualIndicators.newMQL, actualIndicators.newSQL)}%
                    </div>
                  </div>
                </div>
                <div className={dashboardStyle.locals.miniFunnelRow}>
                  <div className={dashboardStyle.locals.miniFunnelText}>
                    {getIndicatorNickname('SQL')}
                  </div>
                  <div className={dashboardStyle.locals.miniFunnelStageContainer}>
                    <div className={dashboardStyle.locals.miniFunnelSql}>
                      {actualIndicators.newSQL}
                    </div>
                    <div className={dashboardStyle.locals.miniFunnelConv}
                         style={{left: '125px'}}
                         data-tip={getCohortTooltip('SQL', 'opps', actualIndicators.SQLToOppConversionRate)}
                         data-for="appTip">
                      <div className={dashboardStyle.locals.curvedArrow}/>
                      {calcConvRate(actualIndicators.newSQL, actualIndicators.newOpps)}%
                    </div>
                  </div>
                </div>
                <div className={dashboardStyle.locals.miniFunnelRow}>
                  <div className={dashboardStyle.locals.miniFunnelText}>
                    {getIndicatorNickname('opps')}
                  </div>
                  <div className={dashboardStyle.locals.miniFunnelStageContainer}>
                    <div className={dashboardStyle.locals.miniFunnelOpps}>
                      {actualIndicators.newOpps}
                    </div>
                    <div className={dashboardStyle.locals.miniFunnelConv}
                         style={{left: '109px'}}
                         data-tip={getCohortTooltip('opps', 'users', actualIndicators.OppToAccountConversionRate)}
                         data-for="appTip">
                      <div className={dashboardStyle.locals.curvedArrow}/>
                      {calcConvRate(actualIndicators.newOpps, actualIndicators.newUsers)}%
                    </div>
                  </div>
                </div>
                <div className={dashboardStyle.locals.miniFunnelRow}>
                  <div className={dashboardStyle.locals.miniFunnelText}>
                    {getIndicatorNickname('users')}
                  </div>
                  <div className={dashboardStyle.locals.miniFunnelStageContainer}>
                    <div className={dashboardStyle.locals.miniFunnelUsers}>
                      {actualIndicators.newUsers}
                    </div>
                  </div>
                </div>
                <div style={{display: 'flex'}}>
                  <div className={dashboardStyle.locals.column}
                       style={{padding: '10px 20px 0 0', width: 'auto', marginRight: 'auto'}}>
                    <div className={dashboardStyle.locals.snapshotNumber}>
                      {formatBudgetShortened(actualIndicators.sessions)}
                    </div>
                    <div className={dashboardStyle.locals.snapshotText}>
                      Sessions
                    </div>
                  </div>
                  <div className={dashboardStyle.locals.column}
                       style={{padding: '10px 20px 0 0', width: 'auto', marginRight: 'auto'}}>
                    <div className={dashboardStyle.locals.snapshotNumber}>
                      ${formatBudgetShortened(monthlyBudget)}
                    </div>
                    <div className={dashboardStyle.locals.snapshotText}>
                      Budget
                    </div>
                  </div>
                  <div className={dashboardStyle.locals.column} style={{padding: '10px 0 0 0', width: 'auto'}}>
                    <div className={dashboardStyle.locals.snapshotNumber}>
                      ${formatBudgetShortened(actualIndicators.MRR)}
                    </div>
                    <div className={dashboardStyle.locals.snapshotText}>
                      MRR
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={dashboardStyle.locals.column}
                 data-border={true}
                 data-selected={(showAdvanced && !isPast) ? true : null}>
              <div className={dashboardStyle.locals.columnHeader}>
                <div className={dashboardStyle.locals.timeText}>
                  Next {months} Months
                </div>
                <div className={dashboardStyle.locals.text} style={{borderBottom: 'none'}}>
                  Future
                </div>
                <div className={dashboardStyle.locals.advanced} onClick={() => {
                  this.setState({showAdvanced: !showAdvanced, isPast: false});
                }}/>
                <div style={{position: 'relative'}}>
                  <div className={dashboardStyle.locals.settings} onClick={() => {
                    this.futureSettingsPopup.open();
                  }}/>
                  {months !== undefined && (
                    <MonthsPopup
                      months={months}
                      maxMonths={historyDataLength}
                      onChange={this.handleMonthsChange}
                      getRef={ref => this.futureSettingsPopup = ref}
                      style={{width: 'max-content', top: '20px', left: '-110px'}}
                    />
                  )}
                </div>
              </div>
              <div style={{marginTop: '18px'}}>
                <div className={dashboardStyle.locals.quarter1}>
                  <div className={dashboardStyle.locals.quarterNumber}>
                    {Math.round(futureLTV / futureBudget * 100)}%
                    <div className={dashboardStyle.locals.center} style={{
                      visibility: (totalCost &&
                        isFinite(totalCost) &&
                        pastLTV &&
                        isFinite(pastLTV) &&
                        ((futureLTV / futureBudget) / (pastLTV / totalCost) - 1)) ? 'visible' : 'hidden'
                    }}>
                      <div className={dashboardStyle.locals.historyArrow}
                           data-decline={((futureLTV / futureBudget) / (pastLTV / totalCost) - 1) < 0
                             ? true
                             : null}/>
                      <div className={dashboardStyle.locals.historyGrow}
                           data-decline={((futureLTV / futureBudget) / (pastLTV / totalCost) - 1) < 0 ? true : null}
                           style={{marginRight: '0'}}>
                        {Math.round(((futureLTV / futureBudget) / (pastLTV / totalCost) - 1) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className={dashboardStyle.locals.quarterText}>
                    ROI
                  </div>
                </div>
                <div className={dashboardStyle.locals.quarter2}>
                  <div className={dashboardStyle.locals.quarterNumber}>
                    ${formatBudgetShortened(futureBudget)}
                    <div className={dashboardStyle.locals.center} style={{
                      visibility: (totalCost && isFinite(totalCost) && (futureBudget / totalCost - 1))
                        ? 'visible'
                        : 'hidden'
                    }}>
                      <div className={dashboardStyle.locals.historyArrow}
                           data-decline={(futureBudget / totalCost - 1) < 0 ? true : null}/>
                      <div className={dashboardStyle.locals.historyGrow}
                           data-decline={(futureBudget / totalCost - 1) < 0 ? true : null}
                           style={{marginRight: '0'}}>
                        {Math.round((futureBudget / totalCost - 1) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className={dashboardStyle.locals.quarterText}>
                    Budget
                  </div>
                </div>
                <div className={dashboardStyle.locals.quarter3}>
                  <div className={dashboardStyle.locals.quarterNumber}>
                    ${formatBudgetShortened(futureLTV)}
                    <div className={dashboardStyle.locals.center} style={{
                      visibility: (pastLTV && isFinite(pastLTV) && (futureLTV / pastLTV - 1))
                        ? 'visible'
                        : 'hidden'
                    }}>
                      <div className={dashboardStyle.locals.historyArrow}
                           data-decline={(futureLTV / pastLTV - 1) < 0 ? true : null}/>
                      <div className={dashboardStyle.locals.historyGrow}
                           data-decline={(futureLTV / pastLTV - 1) < 0 ? true : null} style={{marginRight: '0'}}>
                        {Math.round((futureLTV / pastLTV - 1) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className={dashboardStyle.locals.quarterText}>
                    LTV
                  </div>
                </div>
                <div className={dashboardStyle.locals.quarter4}>
                  <div className={dashboardStyle.locals.quarterNumber}>
                    {formatBudgetShortened(furureObjective)}
                    <div className={dashboardStyle.locals.center} style={{
                      visibility: (pastObjective &&
                        isFinite(pastObjective) &&
                        (furureObjective / pastObjective - 1)) ? 'visible' : 'hidden'
                    }}>
                      <div className={dashboardStyle.locals.historyArrow}
                           data-decline={(furureObjective / pastObjective - 1) < 0 ? true : null}/>
                      <div className={dashboardStyle.locals.historyGrow}
                           data-decline={(furureObjective / pastObjective - 1) < 0 ? true : null}
                           style={{marginRight: '0'}}>
                        {Math.round((furureObjective / pastObjective - 1) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className={dashboardStyle.locals.quarterText}>
                    {getIndicatorNickname(funnelFirstObjective)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showAdvanced ?
        <div className={this.classes.cols}>
          <div className={this.classes.colLeft}>
            <PerformanceGraph isPast={isPast} months={months} data={data} defaultIndicator={firstObjective}/>
          </div>
        </div>
        : null}
      {objectivesGauges.length > 0 ?
        <div className={this.classes.cols} style={{maxWidth: '1140px'}}>
          <div className={this.classes.colLeft}>
            <div className={dashboardStyle.locals.item} style={{height: 'auto', width: 'auto'}}>
              <div className={dashboardStyle.locals.text}>
                Objectives
              </div>
              <div className={dashboardStyle.locals.chart}
                   style={{justifyContent: 'center', display: 'block', marginTop: '0'}}>
                {objectivesGauges}
              </div>
            </div>
          </div>
        </div>
        : null}
      <div className={this.classes.cols} style={{width: '825px'}}>
        <DashboardStatWithContext
          title="Annual Budget"
          stat={'$' + formatBudgetShortened(annualBudget)}
          contextStat={'$' + formatBudgetShortened(annualBudgetLeftToPlan)}
          contextText="left to plan"
          isPositive={annualBudgetLeftToPlan > 0}
        />
        <DashboardStatWithContext
          title="Monthly Budget"
          stat={'$' + formatBudgetShortened(monthlyBudget)}
          contextStat={isOnTrack ? 'On-Track' : 'Off-Track'}
          contextText=''
          isPositive={isOnTrack}
          contextStatTooltipText={isOnTrack ? 'Actual spent on-track' : 'Actual spent off-track. Forecasted: ' +
            '$' +
            formatBudgetShortened(monthlyExtapolatedTotalSpending)}
          statWithArrow={false}
        />
        <DashboardStatWithContext
          title="Active Campaigns"
          stat={numberOfActiveCampaigns}
          contextStat={'$' + formatBudgetShortened(monthlyBudgetLeftToInvest)}
          contextText="left to invest"
          isPositive={monthlyBudgetLeftToInvest > 0}
          statWithArrow={false}
        />
        <div className={this.classes.colRight} style={{paddingLeft: 0}}>
          <DashboardStatWithContext
            title="LTV:CAC Ratio"
            stat={ratio}
            contextStat={ratioContextStat ? ratioContextStat + '%' : undefined}
            contextText={ratioContextStat ? 'from last month' : undefined}
            isPositive={ratioContextStat ? ratioContextStat > 0 : undefined}
            emptyStatMessage={'Oh… It seems that the relevant metrics (LTV + CAC) are missing. Please update your data.'}
            showEmptyStat={ratio === null}
            statWithArrow={true}
          />
        </div>
      </div>
      <div className={this.classes.cols} style={{width: '825px'}}>
        <div className={this.classes.colLeft}>
          <div className={dashboardStyle.locals.item} style={{height: '350px', width: '540px'}}>
            <div className={dashboardStyle.locals.text}
                 data-tip="Total allocated budget for campaigns per defined focus" data-for="appTip">
              Campaigns by Focus
            </div>
            <div className={dashboardStyle.locals.chart}>
              <CampaignsByFocus campaigns={campaigns}/>
            </div>
          </div>
        </div>
        <div className={this.classes.colRight}>
          <div className={dashboardStyle.locals.item}
               style={{display: 'inline-block', height: '350px', width: '540px'}}>
            <div className={dashboardStyle.locals.text}>
              Monthly Marketing Mix Summary
            </div>
            <div className={dashboardStyle.locals.chart}>
              <div className={this.classes.footerLeft}>
                <div className={dashboardStyle.locals.index}>
                  {
                    fatherChannelsWithBudgets.map((element, i) => (
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
                          width: '135px',
                          textTransform: 'capitalize'
                        }}>
                          {element.name}
                        </div>
                        <div style={{fontSize: '14px', fontWeight: '600', width: '70px'}}>
                          ${formatNumber(element.value)}
                        </div>
                        <div style={{width: '50px', fontSize: '14px', color: '#7f8fa4'}}>
                          ({Math.round(element.value / monthlyBudget * 100)}%)
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
              <div className={this.classes.footerRight} style={{marginTop: '-30px', width: '315px'}}>
                <PieChart width={429} height={350} onMouseLeave={() => {
                  this.setState({activeIndex: void 0});
                }}>
                  <Pie
                    data={fatherChannelsWithBudgets}
                    dataKey='value'
                    cx={250}
                    cy={150}
                    labelLine={true}
                    innerRadius={75}
                    outerRadius={100}
                    isAnimationActive={false}
                    onMouseMove={this.onPieEnter}
                  >
                    {
                      fatherChannelsWithBudgets.map((entry, index) => <Cell fill={getColor(index)}
                                                                            key={index}/>)
                    }
                  </Pie>
                </PieChart>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={this.classes.cols} style={{width: '1140px'}}>
        <div className={this.classes.colLeft}>
          <TopX title='channel' data={topChannels}/>
        </div>
        <div className={this.classes.colCenter}>
          <TopX title='campaign' data={topCampaigns}/>
        </div>
        <div className={this.classes.colRight}>
          <TopX title='content' data={topContent}/>
        </div>
      </div>
    </div>;
  }
}