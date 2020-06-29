import React from 'react';
import Component from 'components/Component';
import SaveButton from 'components/pages/profile/SaveButton';
import Textfield from 'components/controls/Textfield';
import style from 'styles/plan/planned-actual-tab.css';
import budgetsStyle from 'styles/plan/budget-table.css';
import planStyles from 'styles/plan/plan.css';
import Paging from 'components/Paging';
import {getChannelIcon, getNickname as getChannelNickname, isUnknownChannel} from 'components/utils/channels';
import {formatBudget, formatNumber, getCommitedBudgets} from 'components/utils/budget';
import sumBy from 'lodash/sumBy';
import merge from 'lodash/merge';
import icons from 'styles/icons/plan.css';
import {extractNumber, newFunnelMapping, percentageFormatter} from 'components/utils/utils';
import Table from 'components/controls/Table';
import ChannelsSelect from 'components/common/ChannelsSelect';
import isNil from 'lodash/isNil';
import get from 'lodash/get';
import set from 'lodash/set';
import {getNickname as getIndicatorNickname} from 'components/utils/indicators';
import NumberWithArrow from 'components/NumberWithArrow';

const channelPlatformMapping = {
  'advertising_socialAds_facebookAdvertising': 'isFacebookAdsAuto',
  'advertising_displayAds_googleAdwords': 'isAdwordsAuto',
  'advertising_searchMarketing_SEM_googleAdwords': 'isAdwordsAuto',
  'advertising_socialAds_linkedinAdvertising': 'isLinkedinAdsAuto',
  'advertising_socialAds_twitterAdvertising': 'isTwitterAdsAuto'
};

export default class PlannedVsActual extends Component {

  style = style;
  styles = [planStyles, budgetsStyle, icons];

  static defaultProps = {
    planUnknownChannels: [],
    committedBudgets: [],
    knownChannels: {},
    unknownChannels: {},
    hoverRow: void 0,
    month: 0
  };

  constructor(props) {
    super(props);
    this.state = {
      month: 0
    };
  }

  getCurrentMonthIndex = () => this.props.calculatedData.lastYearHistoryData.historyDataLength;

  componentDidMount() {
    // Set the default month to current
    this.setState({month: this.getCurrentMonthIndex()});
  }

  getObjectToUpdate(currentMonthObject, historyData, historyDataKey) {
    const isCurrentMonth = this.state.month === this.props.calculatedData.lastYearHistoryData.historyDataLength;
    if (isCurrentMonth) {
      return currentMonthObject;
    }
    else {
      return get(historyData, [historyDataKey, this.state.month]);
    }
  }

  addChannel = (event) => {
    const channel = event.value;
    const actualChannelBudgets = {...this.props.actualChannelBudgets};
    const historyData = {...this.props.historyData};
    const objectToUpdate = this.getObjectToUpdate(actualChannelBudgets, historyData, 'actualChannelBudgets');
    set(objectToUpdate, ['knownChannels', channel], 0);
    this.props.updateState({actualChannelBudgets, historyData});
  };

  addOtherChannel = ({value: channel}) => {
    this.props.addUnknownChannel(channel);

    const actualChannelBudgets = {...this.props.actualChannelBudgets};
    const historyData = {...this.props.historyData};
    const objectToUpdate = this.getObjectToUpdate(actualChannelBudgets, historyData, 'actualChannelBudgets');
    set(objectToUpdate, ['unknownChannels', channel], 0);
    this.props.updateState({actualChannelBudgets, historyData});

  };

  updateActual = (channel, value) => {
    const actualChannelBudgets = {...this.props.actualChannelBudgets};
    const historyData = {...this.props.historyData};
    const objectToUpdate = this.getObjectToUpdate(actualChannelBudgets, historyData, 'actualChannelBudgets');
    if (isUnknownChannel(channel)) {
      set(objectToUpdate, ['unknownChannels', channel], value);
    }
    else {
      set(objectToUpdate, ['knownChannels', channel], value);
    }
    this.props.updateState({actualChannelBudgets, historyData});
  };

  setMonth = diff => {
    const maxMonth = this.getCurrentMonthIndex();
    let newMonth = this.state.month + diff;
    if (newMonth < 0) {
      newMonth = 0;
    }
    if (newMonth > maxMonth) {
      newMonth = maxMonth;
    }
    this.setState({month: newMonth});
  };

  updateImpact = (channel, indicator, type, value) => {
    const channelsImpact = {...this.props.channelsImpact};
    const historyData = {...this.props.historyData};
    const objectToUpdate = this.getObjectToUpdate(channelsImpact, historyData, 'channelsImpact');
    set(objectToUpdate, [channel, indicator, type], value);
    this.props.updateState({channelsImpact, historyData});
  };

  render() {
    const {month} = this.state;
    const {calculatedData: {objectives: {funnelFirstObjective}, extarpolateRatio, integrations, lastYearHistoryData: {historyDataLength, months, historyDataWithCurrentMonth: {channelsImpact, planBudgets, unknownChannels: planUnknownChannels, actualChannelBudgets, indicators, attribution}}}} = this.props;
    const attributionChannelsImpact = get(attribution, [month, 'channelsImpact'], {});
    const lastMonthAttributionChannelsImpact = get(attribution, [month - 1, 'channelsImpact'], {});

    const {knownChannels = {}, unknownChannels = {}} = actualChannelBudgets[month];

    const isCurrentMonth = month === historyDataLength;

    const actuals = merge({}, knownChannels, unknownChannels);
    const planned = merge({}, getCommitedBudgets(planBudgets)[month], planUnknownChannels[month]);
    const channels = merge({}, planned, actuals);
    const parsedChannels = Object.keys(channels).map(channel => {
      const actual = actuals[channel];
      const isActualNotEmpty = !isNil(actual);
      const plan = planned[channel] || 0;
      const channelImpact = get(channelsImpact, [month, channel], {});
      const {planned: plannedFunnel = 0, actual: actualFunnel = 0} = channelImpact[funnelFirstObjective] || {};
      const attributedFunnel = get(attributionChannelsImpact, [newFunnelMapping[funnelFirstObjective], channel], 0);
      const {planned: plannedUsers = 0, actual: actualUsers = 0} = channelImpact.newUsers || {};
      const attributedUsers = get(attributionChannelsImpact, ['users', channel], 0);

      const lastMonthChannelImpact = get(channelsImpact, [month - 1, channel], {});
      const {actual: lastMonthActualFunnel = 0} = lastMonthChannelImpact[funnelFirstObjective] || {};
      const lastMonthAttributedFunnel = get(lastMonthAttributionChannelsImpact,
        [newFunnelMapping[funnelFirstObjective], channel],
        0);
      const {actual: lastMonthActualUsers = 0} = lastMonthChannelImpact.newUsers || {};
      const lastMonthAttributedUsers = get(lastMonthAttributionChannelsImpact, ['users', channel], 0);

      return {
        channel,
        isActualNotEmpty,
        actual: isActualNotEmpty ? actual : plan,
        planned: plan,
        plannedFunnel,
        actualFunnel: actualFunnel || attributedFunnel,
        plannedUsers,
        actualUsers: actualUsers || attributedUsers,
        lastMonthActualFunnel: lastMonthActualFunnel || lastMonthAttributedFunnel,
        lastMonthActualUsers: lastMonthActualUsers || lastMonthAttributedUsers
      };
    });

    const getTextfieldItem = (value, onChange, disabled = false) =>
      <div className={this.classes.cellItem}>
        <Textfield style={{
          width: '84px'
        }} value={value} onChange={onChange} disabled={disabled}/>
      </div>;

    const extrapolatedValue = value => Math.round(value / extarpolateRatio);
    const trend = (value, lastMonthValue) => {
      const percentage = percentageFormatter(value - lastMonthValue, lastMonthValue);
      return <div style={{display: 'inline-flex', alignItems: 'center'}}>
        {value}
        {lastMonthValue && value !== lastMonthValue ? <div style={{marginLeft: '6px'}}>
          <NumberWithArrow stat={percentage} isNegative={value < lastMonthValue}/>
        </div> : null}
      </div>;
    };

    const firstFunnelObjectiveNickname = getIndicatorNickname(funnelFirstObjective);
    const userNickname = getIndicatorNickname('newUsers');

    const isAutomatic = (channel) => integrations[channelPlatformMapping[channel]];

    const totalPlannedFunnel = sumBy(parsedChannels, 'plannedFunnel');
    const totalActualFunnel = indicators[month][funnelFirstObjective];
    const totalPlannedUsers = sumBy(parsedChannels, 'plannedUsers');
    const totalActualUsers = indicators[month].newUsers;

    const columns = [
      {
        id: 'channel',
        header: 'Channel',
        footer: 'Total',
        cell: ({channel}) => (
          <div className={this.classes.cellItem}>
            <div className={budgetsStyle.locals.rowIcon} data-icon={getChannelIcon(channel)}/>
            <div className={this.classes.channelName}>{getChannelNickname(channel)}</div>
            {isAutomatic(channel) ? <div className={this.classes.automaticLabel}>Auto</div> : null}
          </div>
        ),
        minWidth: 240,
        fixed: 'left'
      },
      {
        id: 'plannedBudget',
        header: 'Planned Budget',
        footer: formatBudget(sumBy(parsedChannels, 'planned')),
        cell: ({planned}) => formatBudget(planned),
        sortable: true,
        sortMethod: (a, b) => a.planned - b.planned
      },
      {
        id: 'actualCost',
        header: 'Actual Cost',
        footer: formatBudget(sumBy(parsedChannels, 'actual')),
        cell: ({actual, channel}) =>
          getTextfieldItem(
            formatBudget(actual),
            e => this.updateActual(channel, extractNumber(e.target.value)),
            isAutomatic(channel)
          )
      },
      {
        id: 'planVsActual',
        header: 'Plan vs Actual',
        footer: formatBudget(sumBy(parsedChannels, item => item.planned - item.actual, true)),
        cell: ({planned, actual}) => formatBudget(planned - actual, true)
      },
      {
        id: 'pacingFor',
        header: 'Pacing for',
        footer: isCurrentMonth ? formatBudget(sumBy(parsedChannels,
          item => item.isActualNotEmpty ? extrapolatedValue(item.actual) : item.actual)) : '-',
        cell: ({actual, isActualNotEmpty}) => isCurrentMonth
          ? formatBudget(isActualNotEmpty ? extrapolatedValue(actual) : actual)
          : '-',
        divider: true
      },
      {
        id: 'plannedObjective',
        header: <div data-tip="what's your expectation?" data-for="appTip">Planned {firstFunnelObjectiveNickname}</div>,
        footer: formatNumber(totalPlannedFunnel),
        cell: ({plannedFunnel, channel}) =>
          getTextfieldItem(
            formatNumber(plannedFunnel),
            e => this.updateImpact(channel, funnelFirstObjective, 'planned', extractNumber(e.target.value))
          )
      },
      {
        id: 'actualObjective',
        header: `Actual ${firstFunnelObjectiveNickname}`,
        footer: formatNumber(totalActualFunnel),
        cell: ({actualFunnel, channel}) =>
          getTextfieldItem(
            formatNumber(actualFunnel),
            e => this.updateImpact(channel, funnelFirstObjective, 'actual', extractNumber(e.target.value))
          )
      },
      {
        id: 'planVsActualFunnel',
        header: 'Plan vs Actual',
        footer: formatNumber(totalPlannedFunnel - totalActualFunnel),
        cell: ({plannedFunnel, actualFunnel}) => formatNumber(plannedFunnel - actualFunnel)
      },
      {
        id: 'pacingForFunnel',
        header: 'Pacing for',
        footer: isCurrentMonth ? trend(sumBy(parsedChannels, item => extrapolatedValue(item.actualFunnel)),
          sumBy(parsedChannels, item => item.lastMonthActualFunnel)) : '-',
        cell: ({actualFunnel, lastMonthActualFunnel}) => isCurrentMonth ? trend(extrapolatedValue(actualFunnel),
          lastMonthActualFunnel) : '-',
        divider: true
      },
      {
        id: 'plannedUser',
        header: <div data-tip="what's your expectation?" data-for="appTip">Planned {userNickname}</div>,
        footer: formatNumber(totalPlannedUsers),
        cell: ({plannedUsers, channel}) =>
          getTextfieldItem(
            formatNumber(plannedUsers),
            e => this.updateImpact(channel, 'newUsers', 'planned', extractNumber(e.target.value))
          )
      },
      {
        id: 'actualUser',
        header: `Actual ${userNickname}`,
        footer: formatNumber(totalActualUsers),
        cell: ({actualUsers, channel}) =>
          getTextfieldItem(
            formatNumber(actualUsers),
            e => this.updateImpact(channel, 'newUsers', 'actual', extractNumber(e.target.value))
          )
      },
      {
        id: 'planVsActualUser',
        header: 'Plan vs Actual',
        footer: formatNumber(totalPlannedUsers - totalActualUsers),
        cell: ({plannedUsers, actualUsers}) => formatNumber(plannedUsers - actualUsers)
      },
      {
        id: 'pacingForUser',
        header: 'Pacing for',
        footer: isCurrentMonth ? trend(sumBy(parsedChannels, item => extrapolatedValue(item.actualUsers)),
          sumBy(parsedChannels, item => item.lastMonthActualUsers)) : '-',
        cell: ({actualUsers, lastMonthActualUsers}) => isCurrentMonth ? trend(extrapolatedValue(actualUsers),
          lastMonthActualUsers) : '-'
      }
    ];

    return <div>
      <div className={this.classes.wrap}>
        <div className={this.classes.innerBox}>
          <div className={planStyles.locals.title}>
            <Paging title={months[month]} onBack={() => this.setMonth(-1)} onNext={() => this.setMonth(1)}/>
          </div>
          <div className={planStyles.locals.innerBox}>
            <Table
              className={planStyles.locals.innerBox}
              columns={columns}
              data={parsedChannels}
              defaultSorted={[{id: 'plannedBudget', desc: true}]}
              showFootRowOnHeader
            />
            <div>
              <div className={this.classes.bottom}>
                <div style={{
                  paddingBottom: '25px',
                  width: '460px'
                }} className={this.classes.channelsRow}>
                  <ChannelsSelect className={this.classes.channelsSelect}
                                  withOtherChannels={true}
                                  selected={-1}
                                  isChannelDisabled={channel => Object.keys(channels).includes(channel)}
                                  onChange={this.addChannel}
                                  onNewOptionClick={this.addOtherChannel}
                                  label={`Add a channel`}
                                  labelQuestion={['']}
                                  description={['Are there any channels you invested in the last month that weren’t recommended by InfiniGrow? It is perfectly fine; it just needs to be validated so that InfiniGrow will optimize your planning effectively.\nPlease choose only a leaf channel (a channel that has no deeper hierarchy under it). If you can’t find the channel you’re looking for, please choose “other” at the bottom of the list, and write the channel name/description clearly.']}/>
                </div>
                <div className={this.classes.footer} style={{marginTop: '150px'}}>
                  <SaveButton onClick={() => {
                    this.setState({saveFail: false, saveSuccess: false}, () => {
                      this.props.updateUserMonthPlan({
                        actualChannelBudgets: this.props.actualChannelBudgets,
                        historyData: this.props.historyData,
                        channelsImpact: this.props.channelsImpact
                      }, this.props.region, this.props.planDate);
                      this.setState({saveSuccess: true});
                    });
                  }} success={this.state.saveSuccess} fail={this.state.saveFail}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }
}