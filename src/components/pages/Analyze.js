import React from 'react';
import Component from 'components/Component';
import Page from 'components/Page';
import style from 'styles/plan/plan.css';
import analyzeStyle from 'styles/analyze/analyze.css';
import Select from 'components/controls/Select';
import setupStyle from 'styles/attribution/attribution-setp.css';
import {getNickname as getIndicatorNickname} from 'components/utils/indicators';

export default class Analyze extends Component {

  style = style;
  styles = [analyzeStyle, setupStyle];

  static defaultProps = {
    monthsExceptThisMonth: 0
  };

  render() {
    const {attribution: {channelsImpact, groupByMapping, usersByEmail, usersByAccount}, attributionModel, monthsExceptThisMonth, calculatedData: {historyData: {historyDataLength}}} = this.props;

    const attributionModels = [
      {value: false, label: 'Full Journey'},
      {value: 'firsttouch', label: 'Introducer'},
      {value: 'lasttouch', label: 'Converter'},
      {value: 'linear', label: 'Linear'},
      {value: 'timeDecay', label: 'Time Decay'},
      {value: 'uShaped', label: 'U-Shaped'},
      {value: 'wShaped', label: 'W-Shaped'},
      {value: 'zShaped', label: 'Full-Path (Z-Shaped)'},
    ];

    const selectedModelIndex = attributionModels.findIndex(model => model.value === attributionModel);
    const attributionModelLabel = attributionModels[(selectedModelIndex > -1 ? selectedModelIndex : 0)].label;

    const selectOptions = [];
    for (let i = 0; i < historyDataLength + 1; i++) {
      const lastXMonth = i;
      selectOptions.push({value: i, label: lastXMonth ? `Last ${lastXMonth + 1} months` : 'This month'});
    }

    const getTotalParam = param => (channelsImpact && channelsImpact[param]
      ? Object.keys(channelsImpact[param])
        .reduce((channelsSum, item) => channelsSum + channelsImpact[param][item], 0)
      : 0);

    const getSelectOptions = object => {
      return Object.keys(object).map(key => {
        return {
          value: key,
          label: object[key]
        };
      });
    };

    const getMetricDataByMapping = (metric) => {
      const groupBy = groupByMapping[metric];
      return groupBy === 'contacts' ? usersByEmail : usersByAccount;
    };

    const getMetrics = (isSingular = false) => {
      return {
        MCL: getIndicatorNickname('MCL', isSingular),
        MQL: getIndicatorNickname('MQL', isSingular),
        SQL: getIndicatorNickname('SQL', isSingular),
        opps: getIndicatorNickname('opps', isSingular),
        users: getIndicatorNickname('users', isSingular)
      }
    };
    const metrics = getMetrics();
    const metricsOptions = getSelectOptions(metrics);

    const getAttributedMetrics = (isSingular = false) => {
      const metrics = getMetrics(isSingular);
      const attributedPrefix = 'Attributed';
      return _.mapValues(metrics, (value) => `${attributedPrefix} ${value}`)
    };

    const getMetricsWithInfluenced = (isSingular = false) => {
      const attributedMetrics = getAttributedMetrics(isSingular);
      const influencePrefix = 'Influenced';
      return {
        ...attributedMetrics,
        influencedMCL: `${influencePrefix} ${metrics.MCL}`,
        influencedMQL: `${influencePrefix} ${metrics.MQL}`,
        influencedSQL: `${influencePrefix} ${metrics.SQL}`,
        influencedOpps: `${influencePrefix} ${metrics.opps}`,
        influencedUsers: `${influencePrefix} ${metrics.users}`
      }
    };
    const metricsWithInfluenced = getMetricsWithInfluenced();
    const metricsWithInfluencedSingular = getMetricsWithInfluenced(true);
    const metricsWithInfluencedOptions = getSelectOptions(metricsWithInfluenced);

    const revenueMetrics = {
      revenue: 'attributed revenue',
      pipeline: 'attributed pipeline',
      LTV: 'attributed LTV',
      influencedRevenue: 'influenced revenue',
      influencedPipeline: 'influenced pipeline',
      influencedLTV: 'influenced LTV'
    };
    const revenueMetricsOptions = getSelectOptions(revenueMetrics);

    const childrenWithProps = React.Children.map(this.props.children,
      (child) => React.cloneElement(child,
        {
          ...this.props,
          revenueMetrics,
          revenueMetricsOptions,
          metricsWithInfluenced,
          metricsWithInfluencedOptions,
          metricsWithInfluencedSingular,
          metricsOptions,
          getTotalParam: getTotalParam,
          totalRevenue: getTotalParam('revenue'),
          getMetricDataByMapping,
          attributionModelLabel
        }));
    return <div>
      <Page contentClassName={this.classes.content} innerClassName={this.classes.pageInner} width="100%">
        <div className={this.classes.head}>
          <div className={this.classes.headTitle}>Analyze</div>
          <div className={this.classes.headPlan}>
            <div className={analyzeStyle.locals.text}>Time Frame:</div>
            <Select
              selected={monthsExceptThisMonth}
              select={{options: selectOptions}}
              onChange={(e) => {
                this.props.calculateAttributionData(e.value, attributionModel);
              }}
              iconRendererOnValue={true}
              iconFromValue={() => 'icons:calendar'}
              className={analyzeStyle.locals.dateSelect}
            />
            <div className={analyzeStyle.locals.text}>Attribution Model:</div>
            <Select
              selected={this.props.attributionModel ? this.props.attributionModel : false}
              select={{
                options: attributionModels
              }}
              onChange={(e) => {
                this.props.calculateAttributionData(monthsExceptThisMonth, e.value);
              }}
              className={analyzeStyle.locals.dateSelect}
            />
          </div>
        </div>
        <div style={{paddingTop: '90px'}}>
          {childrenWithProps}
        </div>
      </Page>
    </div>;
  }
}