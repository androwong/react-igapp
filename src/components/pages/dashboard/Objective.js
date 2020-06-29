import React from 'react';
import Component from 'components/Component';
import style from 'styles/dashboard/objective.css';
import {formatNumber} from 'components/utils/budget';
import ObjectiveIcon from 'components/common/ObjectiveIcon';
import {getNumberOfDaysBetweenDates} from 'components/utils/date';
import {getIndicatorDisplaySign} from 'components/utils/indicators';

export default class Objective extends Component {

  style = style;

  static defaultProps = {
    sqSize: 200,
    strokeWidth: 16
  };

  getDaysLeft() {
    const numberOfDays = getNumberOfDaysBetweenDates(this.props.timeFrame);
    if (numberOfDays) {
      return `${numberOfDays} days left`;
    }
    return 'Finished!';
  }

  render() {
    // Size of the enclosing square
    const sqSize = this.props.sqSize;
    // SVG centers the stroke width on the radius, subtract out so circle fits in square
    const radius = (this.props.sqSize - this.props.strokeWidth) / 2;
    // Enclose cicle in a circumscribing square
    const viewBox = `0 0 ${sqSize} ${sqSize}`;
    // Arc length at 100% coverage is the circle circumference
    const dashArray = radius * Math.PI * 2;
    // Scale 100% coverage overlay with the actual percent
    const dashOffset = dashArray - dashArray * Math.min(1, this.props.value / this.props.target) / 2;
    return <div className={this.classes.inner}>
      <svg
        style={{marginTop: '25px'}}
        width={this.props.sqSize * 1.1}
        height={this.props.sqSize}
        viewBox={viewBox}>
        <clipPath id="cut-off-bottom">
          <rect x="0" y="0" width={this.props.sqSize} height={this.props.sqSize / 2}/>
        </clipPath>
        <circle
          className={this.classes.circleBackground}
          cx={this.props.sqSize / 2}
          cy={this.props.sqSize / 2}
          r={radius}
          strokeWidth={this.props.strokeWidth}
          style={{
            clipPath: 'url(#cut-off-bottom)'
          }}
        />
        <text
          className={this.classes.target}
          x="95%"
          y="50%"
          dy="20px"
          textAnchor="middle"
          alignmentBaseline="text-after-edge">
          {formatNumber(Math.round(this.props.target)) || 0}
        </text>
        <circle
          className={this.classes.circleProgress}
          cx={this.props.sqSize / 2}
          cy={this.props.sqSize / 2}
          r={radius}
          strokeWidth={`${this.props.strokeWidth}px`}
          // Start progress marker at 12 O'Clock
          transform={`rotate(-180 ${this.props.sqSize / 2} ${this.props.sqSize / 2})`}
          style={{
            strokeDasharray: dashArray,
            strokeDashoffset: dashOffset,
            stroke: this.props.color
          }}/>
        <text x="50%" y="35%" textAnchor="middle">
          <tspan className={this.classes.current}>
            {formatNumber(Math.round(this.props.value) || 0)}
          </tspan>
          <tspan className={this.classes.currentMark} dy={-5} dx={2}>
            {getIndicatorDisplaySign(this.props.indicator)}
          </tspan>
        </text>
        <text className={this.classes.title} x="50%" y="45%" textAnchor="middle">
          {this.props.title}
        </text>
      </svg>
      <div className={this.classes.bottom}>
        <ObjectiveIcon project={this.props.project}
                       target={this.props.target}
                       value={this.props.value}/>
        <div className={this.classes.progress}>
          <div className={this.classes.progressFill}
               style={{backgroundImage: `linear-gradient(to right, #e6e8f0, ${this.props.color})`}}/>
          <div className={this.classes.timeLeft}>
            {this.getDaysLeft()}
          </div>
        </div>
      </div>
    </div>;
  }

}