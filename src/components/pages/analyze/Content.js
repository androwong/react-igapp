import React from 'react';
import Component from 'components/Component';
import style from 'styles/onboarding/onboarding.css';
import dashboardStyle from 'styles/dashboard/dashboard.css';
import {formatBudgetShortened} from 'components/utils/budget';
import {getNickname as getChannelNickname} from 'components/utils/channels';
import {getNickname as getIndicatorNickname} from 'components/utils/indicators';
import {FeatureToggle} from 'react-feature-toggles';
import icons from 'styles/icons/plan.css';
import {newFunnelMapping} from 'components/utils/utils';
import StatSquare from 'components/common/StatSquare';
import AttributionTable from 'components/pages/analyze/AttributionTable';
import {get} from 'lodash';

export default class Content extends Component {

  style = style;
  styles = [dashboardStyle, icons];

  constructor(props) {
    super(props);

    this.state = {
      attributionTableIndicator: 'MCL',
      attributionTableRevenueMetric: 'revenue',
      sortBy: 'webVisits',
      isDesc: 1
    };
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
    const {attributionModelLabel, totalRevenue, attribution, calculatedData: {objectives: {funnelFirstObjective}, historyData: {historyDataWithCurrentMonth}}} = this.props;
    const attributionPages = attribution.pages || [];

    const additionalColumns = [{title: 'Read Ratio', type: 'read-ratio'},
      {title: 'Proceed Ratio', type: 'proceed-ratio'}, {title: 'Channel', type: 'channel', addAtStart: true}];

    const getPageItemData = (page, dataKey) => get(page, dataKey, 0);
    const getPageItemTitle = (page) => {
      const {title} = page;
      return <div className={dashboardStyle.locals.contentTitle} data-tip={title} data-for='appTip'>
        {title}
      </div>;
    };

    const additionalColumnValue = (item, columnType) => {
      switch (columnType) {
        case 'channel': {
          const {channel} = item;
          return {nickname: getChannelNickname(channel), key: channel};
        }
        case 'proceed-ratio': {
          const webVisits = getPageItemData(item, 'webVisits');
          return (webVisits ? Math.round(getPageItemData(item, 'proceed') / webVisits * 100) : 0);
        }
        case 'read-ratio': {
          const total = getPageItemData(item, 'total');
          return (total ? Math.round(getPageItemData(item, 'totalRead') / total * 100) : 0);
        }
      }
    };

    const formatAdditionColumn = (value, columnType) => {
      if (columnType === 'channel') {
        const {nickname, key} = value;
        return <div style={{display: 'flex'}}>
          <div className={dashboardStyle.locals.channelIcon} data-icon={'plan:' + key}/>
          <div className={dashboardStyle.locals.channelTable}>
            {nickname}
          </div>
        </div>;
      }
      else {
        return value + '%';
      }
    };

    const actualIndicatorsArray = historyDataWithCurrentMonth.indicators;

    const objective = funnelFirstObjective;

    const pagesData = attributionPages.map(item => {
      return {
        channel: item.channel,
        title: item.title,
        revenueMetric: item[this.state.attributionTableRevenueMetric],
        webVisits: item.webVisits,
        conversion: item.conversion,
        funnelIndicator: item[this.state.attributionTableIndicator],
        readRatio: item.total ? Math.round(item.totalRead / item.total * 100) : 0,
        proceedRatio: item.webVisits ? Math.round(item.proceed / item.webVisits * 100) : 0
      };
    });

    const revenue = attributionPages.reduce((sum, item) => sum + item.revenue, 0);
    const impact = attributionPages.reduce((sum, item) => sum + item[newFunnelMapping[objective]], 0) /
      actualIndicatorsArray.reduce((sum, item) => sum + (item[objective] || 0), 0);
    const avgReadRatio = pagesData.reduce((sum, item) => sum + item.readRatio, 0) / attributionPages.length;
    const avgProceedRatio = pagesData.reduce((sum, item) => sum + item.proceedRatio, 0) / attributionPages.length;

    const objectiveNickName = getIndicatorNickname(objective);

    const outOfTotalRevenue = Math.round((revenue / totalRevenue) * 100);

    return <div>
      <div className={this.classes.wrap}>
        <div className={this.classes.cols} style={{width: '825px'}}>
          <StatSquare title='Content-Influenced Revenue'
                      stat={`$${formatBudgetShortened(revenue)}`}
                      contextStat={isFinite(outOfTotalRevenue) ? `${outOfTotalRevenue}% out of $${formatBudgetShortened(
                        totalRevenue)}` : null}
          />
          <StatSquare title={`Impact On ${getIndicatorNickname(objective)}`}
                      stat={`${isFinite(impact) ? Math.round(impact * 100) : 0}%`}
                      tooltipText={`# of ${objectiveNickName} that have been influenced by content out of the total ${objectiveNickName}.`}
          />
          <StatSquare title="Avg. Read Ratio"
                      stat={`${Math.round(avgReadRatio)}%`}
                      tooltipText='How many out of those who started to read the content piece, actually read/finished it.'
          />
          <StatSquare title="Avg. Proceed ratio"
                      stat={`${Math.round(avgProceedRatio)}%`}
                      tooltipText='How many out of those who saw/read the content piece, moved to another page in the website afterward.'
          />
        </div>
        <div>
          <FeatureToggle featureName="attribution">
            <AttributionTable showCostColumns={false}
                              data={attributionPages}
                              additionalColumns={additionalColumns}
                              formatAdditionColumn={formatAdditionColumn}
                              dataNickname='Content'
                              getItemCost={() => ''}
                              getItemData={getPageItemData}
                              getItemTitle={getPageItemTitle}
                              showTotalRow={false}
                              additionalColumnValue={additionalColumnValue}
                              attributionModel={attributionModelLabel}
            />
          </FeatureToggle>
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