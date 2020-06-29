import React from 'react';
import PropTypes from 'prop-types';
import Component from 'components/Component';
import dashboardStyle from 'styles/dashboard/dashboard.css';
import {formatBudget, formatNumber} from 'components/utils/budget';
import {sortBy, sumBy, get} from 'lodash';
import StageSelector from 'components/pages/analyze/StageSelector';
import style from 'styles/onboarding/onboarding.css';
import {getNickname} from 'components/utils/indicators';
import {precisionFormat} from 'utils';
import {averageFormatter, efficiencyFormatter, influencedMapping} from 'components/utils/utils';

export default class AttributionTable extends Component {

  style = style;
  styles = [dashboardStyle];

  static propTypes = {
    data: PropTypes.array,
    dataNickname: PropTypes.string,
    getItemCost: PropTypes.func,
    getItemData: PropTypes.func,
    getItemTitle: PropTypes.func,
    additionalColumns: PropTypes.array,
    additionalColumnValue: PropTypes.func,
    formatAdditionColumn: PropTypes.func,
    formatAdditionColumnTotal: PropTypes.func,
    showTotalRow: PropTypes.bool,
    showCostColumns: PropTypes.bool,
    attributionModel: PropTypes.string
  };

  static defaultProps = {
    additionalColumns: [],
    showTotalRow: true,
    showCostColumns: true
  };

  constructor(props) {
    super(props);

    this.state = {
      selectedStageIndex: 1,
      sortByColumn: 'row-title',
      isReverse: true
    };
  }

  render() {
    const {attributionModel, showCostColumns, showTotalRow, additionalColumns, formatAdditionColumn, formatAdditionColumnTotal, data, dataNickname, getItemCost, getItemData, getItemTitle, additionalColumnValue} = this.props;
    const {selectedStageIndex, sortByColumn, isReverse} = this.state;

    const getInfluencedDataKey = (dataKey) => {
      return influencedMapping[dataKey];
    };

    const costDependentColumnTypes = ['cost', 'efficiency', 'roi', 'pipeline-roi'];
    const getNicknameForIndicator = (indicator, isSingular) => {
      if (indicator === 'webVisits') {
        if (isSingular) {
          return 'Identified Visitor';
        }
        else {
          return 'Identified Visitors';
        }
      }

      else {
        return getNickname(indicator, isSingular);
      }
    };

    const pluralNickname = (indicator) => getNicknameForIndicator(indicator, false);

    const stageEfficiency = (value) => efficiencyFormatter(value, singularIndicatorNickname);

    const titleColumn = {title: dataNickname, type: 'row-title'};
    const costColumn = {title: 'Cost', type: 'cost'};
    const efficiencyColumn = {title: 'Efficiency', type: 'efficiency'};

    const nonEmptyRowDataTypes = ['stage-indicator',
      'influenced-stage-indicator',
      'pipeline',
      'revenue',
      'influenced-revenue'];

    const getIndicatorBaseDefinition = (indicator) => {
      return {
        name: pluralNickname(indicator),
        dataKey: indicator,
        columns: [
          {...titleColumn},
          {...costColumn},
          {title: `Touched ${pluralNickname(indicator)}`, type: 'influenced-stage-indicator'},
          {title: `Attributed ${pluralNickname(indicator)}`, type: 'stage-indicator'},
          {...efficiencyColumn}
        ]
      };
    };

    const addColumnsToStageDefinition = (stageDefinition, columns) => {
      return {...stageDefinition, columns: [...stageDefinition.columns, ...columns]};
    };

    let usersStageDefinition = getIndicatorBaseDefinition('users');
    usersStageDefinition = addColumnsToStageDefinition(usersStageDefinition,
      [
        {title: 'Touched Revenue', type: 'influenced-revenue'},
        {title: 'Attributed Revenue', type: 'revenue'},
        {title: 'ROI', type: 'roi'},
        {title: 'ARPA', type: 'arpa'},
        {title: 'LTV', type: 'ltv'}
      ]
    );

    let oppsStageDefinition = getIndicatorBaseDefinition('opps');
    oppsStageDefinition = addColumnsToStageDefinition(oppsStageDefinition,
      [
        {title: 'Pipeline', type: 'pipeline'},
        {title: 'Pipeline ROI', type: 'pipeline-roi'}
      ]
    );

    const basicStages = [
      {
        name: 'Identified Visitors',
        dataKey: 'webVisits',
        columns: [
          {...titleColumn},
          {...costColumn},
          {title: 'Identified Visitors', type: 'stage-indicator'},
          {...efficiencyColumn}
        ]
      },
      getIndicatorBaseDefinition('MCL'),
      getIndicatorBaseDefinition('MQL'),
      getIndicatorBaseDefinition('SQL'),
      oppsStageDefinition,
      usersStageDefinition];

    const stagesWithCost = showCostColumns ? basicStages
      : basicStages.map(stage => {
        const filterColumns = stage.columns.filter(column => !costDependentColumnTypes.includes(column.type));
        return {...stage, columns: filterColumns};
      });

    const stages = stagesWithCost.map(stage => {
      // Check which columns should be added at the start of the array and which ones at the end
      const addAtStart = additionalColumns.filter(column => column.addAtStart);
      const addAtEnd = additionalColumns.filter(column => !column.addAtStart);
      return {...stage, columns: [...addAtStart, ...stage.columns, ...addAtEnd]};
    });

    const selectedStage = stages[selectedStageIndex];
    const stageIndicatorKey = selectedStage.dataKey;
    const singularIndicatorNickname = getNicknameForIndicator(stageIndicatorKey,
      true);

    const titleColumnNameLower = dataNickname.toLowerCase();
    const volumeColumnTooltip = (volumeNickname) => `Total ${volumeNickname} generated by the ${titleColumnNameLower}. Calculated by ${attributionModel} model`;

    const toolTipTextMapping = {
      'influenced-stage-indicator': `# of ${singularIndicatorNickname} conversion journeys which the ${titleColumnNameLower} took part in`,
      'stage-indicator': `# of ${pluralNickname(stageIndicatorKey)} generated by the ${titleColumnNameLower}. Calculated by ${attributionModel} model`,
      'influenced-revenue': `Total revenue generated from journeys which the ${titleColumnNameLower} took part in`,
      'revenue': volumeColumnTooltip('revenue'),
      'pipeline': volumeColumnTooltip('pipeline'),
      'efficiency': `Cost per ${singularIndicatorNickname}`
    };

    const headRow = this.getTableRow(null, selectedStage.columns.map(({title, type}) => {
      const tooltipData = toolTipTextMapping[type];

      return <div style={{cursor: 'pointer'}} onClick={() => {
        if (type === sortByColumn) {
          this.setState({isReverse: !isReverse});
        }
        else {
          this.setState({sortByColumn: type, isReverse: true});
        }
      }} data-tip={tooltipData} data-for='appTip'
                  data-effect='float'>
        {title}
      </div>;
    }), {className: dashboardStyle.locals.headRow});

    const getMetricNumber = (item) => getItemData(item, stageIndicatorKey);
    const getInfluencedMetricNumber = (item) => getItemData(item, getInfluencedDataKey(stageIndicatorKey));

    const getItemRevenue = (item) => getItemData(item, 'revenue');

    const getPipeline = (item) => getItemData(item, 'pipeline');
    const getLTV = (item) => getItemData(item, 'LTV');
    const getInfluencedRevenue = (item) => getItemData(item, 'influencedRevenue');

    const getColumnRawData = (item, columnType) => {
      switch (columnType) {
        case 'row-title': {
          return getItemTitle(item);
        }
        case 'cost':
          return getItemCost(item);
        case 'stage-indicator':
          return getMetricNumber(item);
        case 'influenced-stage-indicator':
          return getInfluencedMetricNumber(item);
        case 'efficiency':
          return getItemCost(item) / getMetricNumber(item);
        case 'revenue':
          return getItemRevenue(item);
        case 'arpa':
          return getItemRevenue(item) / getMetricNumber(item);
        case 'roi':
          return getItemRevenue(item) / getItemCost(item);
        case 'pipeline':
          return getPipeline(item);
        case 'pipeline-roi':
          return getPipeline(item) / getItemCost(item);
        case 'ltv':
          return getLTV(item);
        case 'influenced-revenue':
          return getInfluencedRevenue(item);
        default:
          return additionalColumnValue(item, columnType);
      }
    };

    const formatColumnData =
      {
        'row-title': value => value,
        'cost': formatBudget,
        'stage-indicator': precisionFormat,
        'influenced-stage-indicator': Math.round,
        'efficiency': value => stageEfficiency(value),
        'revenue': formatBudget,
        'arpa': averageFormatter,
        'roi': averageFormatter,
        'pipeline': formatBudget,
        'pipeline-roi': averageFormatter,
        'ltv': formatBudget,
        'influenced-revenue': formatBudget
      };

    const getColumnData = (item, columnType) => {
      const value = getColumnRawData(item, columnType);
      const formatter = get(formatColumnData, columnType, (value) => formatAdditionColumn(value, columnType));
      return formatter(value);
    };

    const getTotalColumnData = (data, columnType) => {
      const getTotalCost = () => sumBy(data, getItemCost);

      const totalIndicatorGenerated = (data, getChannelData) => Math.round(data.reduce((sum,
                                                                                        item) => sum +
        getChannelData(item), 0));

      const totalMetric = () => totalIndicatorGenerated(data, getMetricNumber);

      const totalRevenue = () => sumBy(data, getItemRevenue);
      const totalInfluencedRevenue = () => sumBy(data, getInfluencedRevenue);
      const totalPipeline = () => sumBy(data, getPipeline);
      const totalLTV = () => sumBy(data, getLTV);

      switch (columnType) {
        case 'row-title':
          return 'Total';
        case 'cost':
          return formatBudget(getTotalCost());
        case 'stage-indicator':
          return totalMetric();
        case 'influenced-stage-indicator':
          return totalIndicatorGenerated(data, getInfluencedMetricNumber);
        case 'efficiency':
          return stageEfficiency(getTotalCost() / totalMetric());
        case 'revenue':
          return formatBudget(totalRevenue());
        case 'arpa':
          return averageFormatter(totalRevenue() / totalMetric());
        case 'roi':
          return averageFormatter(totalRevenue() / getTotalCost());
        case 'pipeline':
          return formatBudget(totalPipeline());
        case 'pipeline-roi':
          return averageFormatter(totalPipeline() / getTotalCost());
        case 'ltv':
          return formatBudget(totalLTV());
        case 'influenced-revenue':
          return formatBudget(totalInfluencedRevenue());
        default:
          return formatAdditionColumnTotal(data, columnType);
      }
    };

    const filteredData = data.filter(
      item => nonEmptyRowDataTypes.some(columnType => getColumnRawData(item, columnType)));
    const sortedData = sortBy(filteredData, item => getColumnRawData(item, sortByColumn));
    const reversedSortedData = isReverse ? [...sortedData].reverse() : sortedData;

    const stagesData = stages.map(stage => {
      return {
        stageName: stage.name,
        number: formatNumber(Math.round(sumBy(data,
          item => getItemData(item, stage.dataKey))))
      };
    });

    const rows = reversedSortedData
      .map((item, key) => {
        return this.getTableRow(null,
          selectedStage.columns.map(column => getColumnData(item, column.type)), {
            key,
            className: dashboardStyle.locals.tableRow
          });
      });

    const footRow = showTotalRow && this.getTableRow(null,
      selectedStage.columns.map(column => getTotalColumnData(data, column.type)),
      {
        className: dashboardStyle.locals.footRow
      });

    return <div>
      <div style={{width: '1110px', margin: '15px'}}>
        <StageSelector stages={stagesData}
                       selectedIndex={selectedStageIndex}
                       selectStage={(index) => this.setState({selectedStageIndex: index})}/>
      </div>
      <div className={dashboardStyle.locals.item}
           style={{height: '459px', width: '1110px', overflow: 'visible', padding: '15px 0'}}>
        <table className={dashboardStyle.locals.table}>
          <thead className={dashboardStyle.locals.tableHead}>
          {headRow}
          </thead>
          <tbody className={dashboardStyle.locals.tableBody}>
          {rows}
          </tbody>
          <tfoot>
          {footRow}
          </tfoot>
        </table>
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