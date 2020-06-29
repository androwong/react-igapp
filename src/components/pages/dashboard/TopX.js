import React from 'react';
import Component from 'components/Component';
import style from 'styles/dashboard/top-x.css';
import dashboardStyle from "styles/dashboard/dashboard.css";
import icons from 'styles/icons/plan.css';

export default class TopX extends Component {

  style = style;
  styles = [dashboardStyle, icons];

  render() {
    const rows = this.props.data && this.props.data
      .filter(item => item.score)
      .sort((item1, item2) => item2.score - item1.score)
      .slice(0, 5)
      .map((item, index, sortedData) =>
        <div className={this.classes.row} key={index}>
          <div className={this.classes.left}>
            {item.icon ? <div className={dashboardStyle.locals.channelIcon} data-icon={item.icon}/> : null}
            <div className={this.classes.text} data-tip={item.title} data-for="appTip">
              {item.title}
            </div>
          </div>
          <div className={this.classes.right}>
            <div className={this.classes.bar} style={{ width: Math.round(item.score / sortedData[0].score * 165) + 'px' }}/>
          </div>
        </div>
      );

    return <div className={ dashboardStyle.locals.item } style={{ width: '350px', height: '300px' }}>
      <div className={ dashboardStyle.locals.text }>
        Top {this.props.title}s
      </div>
      <div className={this.classes.row}>
        <div className={this.classes.xTitle}>
          {this.props.title}
        </div>
        <div className={this.classes.scoreTitle} data-tip="Total contribution across metrics, calculated with your objectives" data-for="appTip">
          Attribution Score
        </div>
      </div>
      <div>
        {rows}
      </div>
    </div>
  }

}