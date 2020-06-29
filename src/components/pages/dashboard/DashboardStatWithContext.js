import React from 'react';
import PropTypes from 'prop-types';
import Component from 'components/Component';
import style from 'styles/dashboard/dashboard-stat-with-context.css';
import StatSquare from 'components/common/StatSquare';
import NumberWithArrow from 'components/NumberWithArrow';

export default class DashboardStatWithContext extends Component {

  static propTypes = {
    title: PropTypes.string.isRequired,
    stat: PropTypes.node,
    contextStat: PropTypes.node,
    statWithArrow: PropTypes.bool,
    contextText: PropTypes.string,
    isPositive: PropTypes.bool,
    contextStatTooltipText: PropTypes.string,
    showEmptyStat: PropTypes.bool,
    emptyStatMessage: PropTypes.string,
    tooltipText: PropTypes.string
  };

  static defaultProps = {
    contextStatTooltipText: '',
    statWithArrow: false,
    showEmptyStat: false,
    contextText: ''
  };

  style = style;

  render() {
    const stat = <div style={{display: 'inline-flex'}}
                      data-tip={this.props.contextStatTooltipText}
                      data-for='appTip'>
      {this.props.contextStat ?
        this.props.statWithArrow ?
          <NumberWithArrow stat={this.props.contextStat}
                           isNegative={!this.props.isPositive}
                           arrowStyle={{alignSelf: 'center'}}
                           statStyle={{alignSelf: 'center', fontSize: '16px', fontWeight: '500'}}/>
          :
          <div className={this.classes.contextStat + ' ' + this.classes.contextText}
               data-negative={this.props.isPositive ? null : 'negative'}>
            {this.props.contextStat}
          </div>
        : ''}
      {' ' + this.props.contextText}
    </div>;

    return <div>
      <StatSquare {...this.props} contextStat={stat}/>
    </div>;
  }
};