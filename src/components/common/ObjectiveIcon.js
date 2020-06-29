import Component from 'components/Component';
import style from 'styles/controls/objective-icon.css';
import React from 'react';
import PropTypes from 'prop-types';

export default class ObjectiveIcon extends Component {

  style = style;

  static propTypes = {
    target: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    project: PropTypes.number.isRequired
  };

  render() {
    if (this.props.target <= this.props.value) {
      return <div className={this.classes.reachedIcon} data-tip='Goal had been reached' data-for="appTip"/>;
    }
    else if (this.props.project >= this.props.target) {
      return <div className={this.classes.alignedIcon} data-tip='You’re on-track to reach your goal' data-for="appTip"/>;
    }
    else {
      return <div className={this.classes.notAlignedIcon} data-tip='You’re off-track to reach your goal' data-for="appTip"/>;
    }
  }
}