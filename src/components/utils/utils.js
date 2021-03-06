import {formatBudget} from 'components/utils/budget';

export function getExtarpolateRatio(day, monthString) {
  const planDate = monthString.split('/');
  const date = new Date(planDate[1], planDate[0] - 1);
  const numberOfDaysInMonth = 32 - new Date(date.getFullYear(), date.getMonth(), 32).getDate();
  return day.getDate() / numberOfDaysInMonth;
}

export function extractNumber(budget, defaultValue = 0) {
  return parseInt(budget.toString().replace(/\D+/g, '')) || defaultValue;
}

export function averageFormatter(value) {
  return isFinite(value) ? formatBudget(Math.round(value)) : (isNaN(value) ? '0' : '-');
}

export function efficiencyFormatter(value, nickname) {
  const efficiency = averageFormatter(value);
  return efficiency === '0' || efficiency === '-' ? efficiency :
    efficiency + '/' + nickname;
}

export function percentageFormatter(value, total) {
  return `${value ? Math.round(value / total * 100) : 0}%`;
}

export const newFunnelMapping = {
  newMCL: 'MCL',
  newMQL: 'MQL',
  newSQL: 'SQL',
  newOpps: 'opps',
  newUsers: 'users'
};

export const influencedMapping = {
  MCL: 'influencedMCL',
  MQL: 'influencedMQL',
  SQL: 'influencedSQL',
  opps: 'influencedOpps',
  users: 'influencedUsers'
};