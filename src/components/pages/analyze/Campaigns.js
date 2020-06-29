import React from 'react';
import Component from 'components/Component';
import style from 'styles/onboarding/onboarding.css';
import dashboardStyle from 'styles/dashboard/dashboard.css';
import Select from 'components/controls/Select';
import {getNickname as getChannelNickname} from 'components/utils/channels';
import {FeatureToggle} from 'react-feature-toggles';
import {timeFrameToDate} from 'components/utils/objective';
import history from 'history';
import icons from 'styles/icons/plan.css';
import {get} from 'lodash';
import AttributionTable from 'components/pages/analyze/AttributionTable';

export default class Campaigns extends Component {

  style = style;
  styles = [dashboardStyle, icons];

  constructor(props) {
    super(props);

    this.state = {
      attributionTableIndicator: 'MCL',
      conversionIndicator: 'MCL',
      attributionTableRevenueMetric: 'pipeline',
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
    const {attributionModelLabel, attribution: {campaigns: attributionCampaigns}, getMetricDataByMapping, campaigns, metricsOptions} = this.props;

    const additionalColumns = [{title: 'Channels', type: 'channels'}];
    const additionalColumnValue = (item, columnType) => {
      return item.channels;
    };
    const formatAdditionColumn = (value, columnType) => {
      return <div style={{display: 'flex'}}>
        {value.map(channel =>
          <div key={channel}
               data-tip={getChannelNickname(channel)}
               className={dashboardStyle.locals.channelIcon}
               data-for='appTip'
               data-icon={'plan:' + channel}/>
        )}
      </div>;
    };

    const formatAdditionColumnTotal = (data, columnType) => '';

    const getPlatformCampaignIndex = (campaign) => {
      const campaignName = campaign.name;
      return campaigns.findIndex(campaign => (campaign.name ===
        campaignName ||
        (campaign.tracking && campaign.tracking.campaignUTM === campaignName)) && !campaign.isArchived);
    };

    const getPlatformCampaign = (campaign) => campaigns[getPlatformCampaignIndex(campaign)];

    const getCampaignCost = (campaign) => {
      let budget = 0;
      const platformCampaign = getPlatformCampaign(campaign);
      if (platformCampaign) {
        if (platformCampaign.isOneTime) {
          if (platformCampaign.dueDate &&
            timeFrameToDate(platformCampaign.dueDate).getMonth() ===
            new Date().getMonth()) {
            budget = platformCampaign.actualSpent || platformCampaign.budget || 0;
          }
        }
        else {
          if (!platformCampaign.dueDate ||
            (platformCampaign.dueDate && timeFrameToDate(platformCampaign.dueDate) < new Date())) {
            budget = platformCampaign.actualSpent || platformCampaign.budget || 0;
          }
        }
      }

      return budget;
    };

    let campaignsWithData = attributionCampaigns.map((campaign, index) => {
      const campaignName = campaign.name;
      let budget = 0;
      const platformCampaignIndex = campaigns.findIndex(campaign => (campaign.name ===
        campaignName ||
        (campaign.tracking && campaign.tracking.campaignUTM === campaignName)) && !campaign.isArchived);
      const platformCampaign = campaigns[platformCampaignIndex];
      if (platformCampaign) {
        if (platformCampaign.isOneTime) {
          if (platformCampaign.dueDate &&
            timeFrameToDate(platformCampaign.dueDate).getMonth() ===
            new Date().getMonth()) {
            budget = platformCampaign.actualSpent || platformCampaign.budget || 0;
          }
        }
        else {
          if (!platformCampaign.dueDate ||
            (platformCampaign.dueDate && timeFrameToDate(platformCampaign.dueDate) < new Date())) {
            budget = platformCampaign.actualSpent || platformCampaign.budget || 0;
          }
        }
      }
      const json = {
        label: campaignName,
        budget: budget,
        revenueMetric: campaign[this.state.attributionTableRevenueMetric],
        webVisits: campaign.webVisits,
        conversion: campaign.conversion,
        funnelIndicator: campaign[this.state.attributionTableIndicator],
        channels: campaign.channels,
        platformCampaignIndex: platformCampaignIndex,
        campaignIndex: index
      };
      json.ROI = json.budget ? json.revenueMetric / json.budget : 0;
      json.CPX = json.budget / json.funnelIndicator;
      return json;
    });

    campaignsWithData =
      campaignsWithData.filter(item => item.funnelIndicator || item.conversion || item.webVisits || item.revenueMetric);

    const journeys = [];
    let journeysSum = 0;
    const metricData = getMetricDataByMapping(this.state.conversionIndicator);
    metricData.forEach(user => {
      const journey = user.sessions
        .filter(item => item.campaign && Object.keys(item.funnelStages).includes(this.state.conversionIndicator))
        .map(item => {
          return {channel: item.channel, campaign: item.campaign};
        });
      if (journey && journey.length > 0) {
        journeysSum++;
        const alreadyExists = journeys.find(item => item.journey.length ===
          journey.length &&
          item.journey.every((item, index) => item.campaign ===
            journey[index].campaign &&
            item.channel ===
            journey[index].channel));
        if (alreadyExists) {
          alreadyExists.count++;
        }
        else {
          journeys.push({
            journey: journey,
            count: 1
          });
        }
      }
    });

    let journeyCampaignsSum = 0;
    const journeyCampaigns = attributionCampaigns
      .filter(campaign => campaign[this.state.conversionIndicator])
      .map(campaign => {
        const value = campaign[this.state.conversionIndicator];
        journeyCampaignsSum += value;
        return {name: campaign.name, value: value};
      });

    const journeysUI = journeys
      .sort((a, b) => b.count - a.count)
      .map((item, index) =>
        <div key={index} className={dashboardStyle.locals.journeyRow}>
          <div style={{width: '78%'}}>
            <div className={dashboardStyle.locals.journey}>
              {item.journey.map((journeyItem, index) => {
                const journeyText = journeyItem.campaign;
                return <div className={dashboardStyle.locals.channelBox} key={index} data-tip={journeyText}
                            data-for='appTip'>
                  <div className={dashboardStyle.locals.channelIcon} data-icon={'plan:' + journeyItem.channel}
                       style={{margin: '0 5px'}}/>
                  <div className={dashboardStyle.locals.channelText}>
                    {journeyText}
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

    const getCampaignData = (campagin, dataKey) => get(campagin, dataKey, 0);

    const getCampaignTitle = (campagin) => {
      const platformCampaignIndex = getPlatformCampaignIndex(campagin);
      return <div className={dashboardStyle.locals.channelTable}
                  data-link={platformCampaignIndex !== -1 ? true : null}
                  onClick={() => {
                    if (platformCampaignIndex !== -1) {
                      history.push({
                        pathname: '/campaigns/by-channel',
                        query: {campaign: platformCampaignIndex}
                      });
                    }
                  }}>
        {campagin.name}
      </div>;
    };

    return <div>
      <div className={this.classes.wrap}>
        <div>
          <FeatureToggle featureName="attribution">
            <AttributionTable getItemData={getCampaignData} getItemTitle={getCampaignTitle}
                              getItemCost={getCampaignCost} data={attributionCampaigns}
                              dataNickname='Campaign'
                              formatAdditionColumn={formatAdditionColumn}
                              formatAdditionColumnTotal={formatAdditionColumnTotal}
                              additionalColumns={additionalColumns}
                              additionalColumnValue={additionalColumnValue}
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
                    journeyCampaigns
                      .sort((a, b) => b.value - a.value)
                      .map((element, i) => (
                        <div key={i} className={dashboardStyle.locals.fatherChannelBox}>
                          <div className={dashboardStyle.locals.fatherChannelBoxFill}
                               style={{width: Math.round(element.value / journeyCampaignsSum * 400) + 'px'}}/>
                          <div className={dashboardStyle.locals.fatherChannelTitle}>
                            {element.name}
                          </div>
                          <div className={dashboardStyle.locals.fatherChannelValue}>
                            {Math.round(element.value)} ({Math.round(element.value / journeyCampaignsSum * 100)}%)
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