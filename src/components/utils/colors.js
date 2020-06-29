const COLORS = [
  '#189aca',
  '#3cca3f',
  '#a8daec',
  '#70d972',
  '#56b5d9',
  '#8338EC',
  '#40557d',
  '#f0b499',
  '#ffd400',
  '#3373b4',
  '#72c4b9',
  '#FB5607',
  '#FF006E',
  '#76E5FC',
  '#036D19'
];

export function getColor(index) {
  return COLORS[index % COLORS.length];
}