import merge from 'lodash/merge';
import {timeFrameToDate} from 'components/utils/objective';
import {getExtarpolateRatio} from 'components/utils/utils';
import sumBy from 'lodash/sumBy';
import {flattenObjectives} from 'components/utils/objective';
import {getRawDatesSpecific, NUMBER_OF_FUTURE_MONTHS} from 'components/utils/date';
import {getAnnualBudgetLeftToPlan, getCommitedBudgets, getPlanBudgetsData} from 'components/utils/budget';
import {getDatesSpecific} from 'components/utils/date';
import isNil from 'lodash/isNil';
import sum from 'lodash/sum';
import isArray from 'lodash/isArray';

export function calculatedDataExtender(data) {

  const committedBudgets = getCommitedBudgets(data.planBudgets);
  const committedForecasting = data.forecastedIndicators.map(month => {
    const newMonth = {};
    Object.keys(month).forEach(indicator => newMonth[indicator] = month[indicator].committed);
    return newMonth;
  });

  const campaignsWithIndex = data.campaigns.map((campaign, index) => {
    return {...campaign, index: index};
  });
  const activeCampaigns = campaignsWithIndex.filter(campaign => campaign.isArchived !== true);
  const allBudgets = merge([], committedBudgets, data.planUnknownChannels);
  const monthlyBudget = sum(Object.values(allBudgets[0]));
  const monthlyExtarpolatedMoneySpent = calculateActualSpent(committedBudgets[0],
    data.planUnknownChannels[0],
    data.knownChannels,
    data.unknownChannels,
    data.planDate);
  const extarpolateRatio = getExtarpolateRatio(new Date(), data.planDate);

  const dates = getRawDatesSpecific(data.planDate, 0, NUMBER_OF_FUTURE_MONTHS);
  const pastDates = getRawDatesSpecific(data.planDate, data.historyData.indicators.length, 0);
  const pastIndicators = data.historyData.indicators;

  const objectivesData = flattenObjectives(data.objectives,
    data.actualIndicators,
    dates,
    pastIndicators,
    pastDates,
    false);
  const collapsedObjectives = flattenObjectives(data.objectives,
    data.actualIndicators,
    dates,
    pastIndicators,
    pastDates,
    true);

  const funnelPossibleObjectives = ['newMCL', 'newMQL', 'newSQL', 'newOpps', 'newUsers'];
  const prioritizedFunnelObjectives = ['newSQL', 'newOpps', 'newUsers', 'newMQL', 'newMCL'];

  const findFirstNonZeroIndicator = collection => {
    return collection.find(funnelObjective =>
      data.actualIndicators && data.actualIndicators[funnelObjective] > 0);
  };

  const nonZeroFunnelIndicator = findFirstNonZeroIndicator(prioritizedFunnelObjectives) ||
    prioritizedFunnelObjectives[0];
  const funnelObjectives = collapsedObjectives
    .filter(objective => funnelPossibleObjectives.includes(objective.indicator))
    .map(objective => objective.indicator);
  const nonZeroFunnelObjective = findFirstNonZeroIndicator(funnelObjectives);

  const isTrial = new Date() < new Date(data.userAccount.trialEnd);
  const isAccountEnabled = isTrial || data.userAccount.isPaid;
  const annualBudget = getAnnualBudgetFromAppData(data);

  return {
    calculatedData: {
      campaignsWithIndex: campaignsWithIndex,
      committedBudgets: committedBudgets,
      committedForecasting: committedForecasting,
      activeCampaigns: activeCampaigns,
      annualBudget: annualBudget,
      annualBudgetLeftToPlan: getAnnualBudgetLeftToPlan(annualBudget, data.planBudgets, data.planUnknownChannels),
      monthlyBudget: monthlyBudget,
      monthlyExtarpolatedMoneySpent: monthlyExtarpolatedMoneySpent,
      monthlyExtapolatedTotalSpending: monthlyExtarpolatedMoneySpent / extarpolateRatio,
      extarpolateRatio: extarpolateRatio,
      monthlyBudgetLeftToInvest: activeCampaigns.reduce((res, campaign) => {
        if (!campaign.isArchived) {
          if (campaign.isOneTime) {
            if (campaign.dueDate && timeFrameToDate(campaign.dueDate).getMonth() === new Date().getMonth()) {
              res -= campaign.actualSpent || campaign.budget || 0;
            }
          }
          else {
            if (!campaign.dueDate || (campaign.dueDate && new Date() <= timeFrameToDate(campaign.dueDate))) {
              res -= campaign.actualSpent || campaign.budget || 0;
            }
          }
        }
        return res;
      }, monthlyBudget),
      objectives: {
        objectivesData: objectivesData,
        collapsedObjectives: collapsedObjectives,
        firstObjective: collapsedObjectives && collapsedObjectives.length > 0 ? collapsedObjectives[0].indicator : null,
        funnelObjectives: funnelObjectives,
        funnelFirstObjective: nonZeroFunnelObjective || nonZeroFunnelIndicator
      },
      historyData: calculateHistoryData(data, data.historyData, data.monthsExceptThisMonth),
      lastYearHistoryData: calculateHistoryData(data, data.historyData, NUMBER_OF_FUTURE_MONTHS),
      isTrial,
      isAccountEnabled,
      integrations: calculateAutomaticIntegration(data)
    },
    ...data
  };
}

export function getAnnualBudgetFromAppData(data) {
  return !isNil(data.annualBudget) ? data.annualBudget : sum(data.annualBudgetArray);
}

function calculateHistoryData(currentData, historyData, monthExceptThisMonth = 0) {
  const historyDataLength = (data) => data.indicators.length;

  const historyDataWithCurrentMonth = {};
  Object.keys(historyData).forEach(key => {
    const sliceNumber = Math.max(historyDataLength(historyData) - monthExceptThisMonth, 0);
    // Indicators key in current month is ActualIndicators, that's why is has special treatment
    // TODO: generalize
    if (key === 'indicators') {
      historyDataWithCurrentMonth[key] = [...historyData[key], currentData.actualIndicators].slice(sliceNumber);
    }
    else if (key === 'actualIndicatorsDaily') {
      historyDataWithCurrentMonth[key] = [...historyData[key], currentData[key]].slice(sliceNumber);
    }
    else if (key === 'unknownChannels') {
      historyDataWithCurrentMonth[key] = [...historyData[key], currentData.planUnknownChannels[0]].slice(sliceNumber);
    }
    else {
      isArray(currentData[key]) ?
        historyDataWithCurrentMonth[key] = [...historyData[key], currentData[key][0]].slice(sliceNumber)
        :
        historyDataWithCurrentMonth[key] = [...historyData[key], currentData[key]].slice(sliceNumber);
    }
  });

  const months = getDatesSpecific(currentData.planDate, historyDataLength(historyDataWithCurrentMonth) - 1, 1);

  const {committedBudgets, sumBudgets, totalCost} = getPlanBudgetsData(historyDataWithCurrentMonth.planBudgets);

  const indicatorsDataPerMonth = months.map((month, monthIndex) => {
    return {
      name: months[monthIndex],
      ...historyDataWithCurrentMonth.indicators[monthIndex],
      ...committedBudgets[monthIndex],
      total: sumBy(Object.keys(committedBudgets[monthIndex]), (channelKey) => committedBudgets[monthIndex][channelKey])
    };
  });

  const rawMonths = getRawDatesSpecific(currentData.planDate, historyDataLength(historyData), 0);

  return {
    historyDataWithCurrentMonth,
    months,
    rawMonths,
    committedBudgets,
    sumBudgets,
    totalCost,
    indicatorsDataPerMonth,
    historyDataLength: historyDataLength(historyData)
  };
}

function calculateActualSpent(committedBudgets, planUnknownChannels, knownChannels, unknownChannels, planDate) {

  const extarpolateRatio = getExtarpolateRatio(new Date(), planDate);
  const approvedExtarpolate = {...committedBudgets};
  const planUnknownExtarpolate = {...planUnknownChannels};
  Object.keys(approvedExtarpolate).map((key) => {
    approvedExtarpolate[key] *= extarpolateRatio;
  });
  Object.keys(planUnknownExtarpolate).map((key) => {
    planUnknownExtarpolate[key] *= extarpolateRatio;
  });

  if (knownChannels) {
    Object.keys(knownChannels).forEach((key) => approvedExtarpolate[key] = knownChannels[key]);
  }

  if (unknownChannels) {
    Object.keys(unknownChannels).forEach((key) => planUnknownExtarpolate[key] = unknownChannels[key]);
  }

  return sumBy(Object.keys(approvedExtarpolate), (key) => approvedExtarpolate[key]) +
    sumBy(Object.keys(planUnknownExtarpolate), (key) => planUnknownExtarpolate[key]);
}

function calculateAutomaticIntegration(data) {
  const isTwitterAdsAuto = !!(data.twitteradsapi &&
    data.twitteradsapi.oauthAccessToken &&
    data.twitteradsapi.oauthAccessTokenSecret &&
    data.twitteradsapi.accountId);
  const isLinkedinAdsAuto = !!(data.linkedinadsapi && data.linkedinadsapi.tokens && data.linkedinadsapi.accountId);
  const isFacebookAdsAuto = !!(data.facebookadsapi && data.facebookadsapi.accountId && data.facebookadsapi.token);
  const isAdwordsAuto = !!(data.adwordsapi && data.adwordsapi.tokens && data.adwordsapi.customerId);
  const isSalesforceCampaignsAuto = !!(data.salesforceapi &&
    data.salesforceapi.tokens &&
    data.salesforceapi.selectedCampaigns &&
    data.salesforceapi.selectedCampaigns.length >
    0);
  const isSalesforceAuto = !!(data.salesforceapi && data.salesforceapi.tokens && data.salesforceapi.mapping);
  const isMozAuto = !!(data.mozapi && data.mozapi.url);
  const isHubspotAuto = !!(data.hubspotapi && data.hubspotapi.mapping && data.hubspotapi.tokens);
  const isGoogleAuto = !!(data.googleapi && data.googleapi.tokens && data.googleapi.profileId);
  const isLinkedinAuto = !!(data.linkedinapi && data.linkedinapi.accountId && data.linkedinapi.tokens);
  const isFacebookAuto = !!(data.facebookapi && data.facebookapi.pageId);
  const isTwitterAuto = !!(data.twitterapi && data.twitterapi.accountName);
  const isYoutubeAuto = !!(data.youtubeapi && data.youtubeapi.type && data.youtubeapi.id);
  const isStripeAuto = !!(data.stripeapi && data.stripeapi.tokens);
  const isGoogleSheetsAuto = !!(data.googlesheetsapi && data.googlesheetsapi.tokens && data.googlesheetsapi.mapping);

  return {
    isTwitterAdsAuto,
    isLinkedinAdsAuto,
    isFacebookAdsAuto,
    isAdwordsAuto,
    isSalesforceCampaignsAuto,
    isSalesforceAuto,
    isMozAuto,
    isHubspotAuto,
    isGoogleAuto,
    isLinkedinAuto,
    isFacebookAuto,
    isTwitterAuto,
    isYoutubeAuto,
    isStripeAuto,
    isGoogleSheetsAuto
  };
}