import React from 'react';
import Component from 'components/Component';
import style from 'styles/preferences/objective-view.css';
import {formatIndicatorDisplay, getNickname} from 'components/utils/indicators';
import {getColor} from 'components/utils/colors';
import {getNumberOfDaysBetweenDates} from 'components/utils/date';

export default class ObjectiveView extends Component {

  style = style;

  getDaysLeft() {
    return `${getNumberOfDaysBetweenDates(this.props.dueDate)} days left`;
  }

  render() {
    return <div style={{marginBottom: '40px'}}>
      <div className={this.classes.row}>
        <div className={this.classes.start}>
          <div className={this.classes.index}>
            {'#' + (this.props.priority + 1)}
          </div>
          <div className={this.classes.nickname}>
            {getNickname(this.props.indicator)}
          </div>
        </div>
        <div className={this.classes.end}>
          <div className={this.classes.textValue}>
            {(formatIndicatorDisplay(this.props.indicator, this.props.value) || 0) + ' / '}
          </div>
          <div className={this.classes.target}>
            {formatIndicatorDisplay(this.props.indicator, this.props.target)}
          </div>
          <div className={this.classes.textButton} style={{marginLeft: '20px'}} onClick={this.props.editObjective}>
            Edit
          </div>
          <div className={this.classes.textButton} onClick={this.props.deleteObjective}>
            Delete
          </div>
        </div>
      </div>
      <div className={this.classes.row}>
        <div className={this.classes.pipe}>
          <div className={this.classes.pipeFill} style={{
            width: (Math.min(1, this.props.value / this.props.target) * 360) + 'px',
            backgroundImage: `linear-gradient(to right, #e6e8f0, ${getColor(this.props.index)})`
          }}/>
        </div>
        <div className={this.classes.timeLeft}>
          {this.getDaysLeft()}
        </div>
      </div>
    </div>;
  }
}