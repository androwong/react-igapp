import React from 'react';
import PropTypes from 'prop-types';
import Component from 'components/Component';
import style from 'styles/stat-square.css';

export default class StatSquare extends Component {

  static propTypes = {
    title: PropTypes.string,
    stat: PropTypes.node,
    contextStat: PropTypes.node,
    tooltipText: PropTypes.string,
    showEmptyStat: PropTypes.bool,
    emptyStatMessage: PropTypes.string
  };

  static defaultProps = {
    tooltipText: '',
    showEmptyStat: false
  };

  style = style;

  render() {
    return <div>
      <div className={this.classes.col} data-for='appTip' data-tip={this.props.tooltipText}>
        <div className={this.classes.item}>
          <div className={this.classes.text}>{this.props.title}</div>
          {this.props.showEmptyStat ?
            <div>
              <div className={this.classes.center}>
                <div className={this.classes.sadIcon}/>
              </div>
              <div className={this.classes.noMetrics}>
                {this.props.emptyStatMessage}
              </div>
            </div>
            :
            <div>
              <div className={this.classes.number}>{this.props.stat}</div>
              <div className={this.classes.context}>
                {this.props.contextStat}
              </div>
            </div>
          }
        </div>
      </div>
    </div>;
  }
}