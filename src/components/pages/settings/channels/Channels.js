import React from 'react';
import Component from 'components/Component';
import Page from 'components/Page';
import style from 'styles/plan/plan.css';

export default class Channels extends Component {

  style = style;

  constructor(props) {
    super(props);
    this.state = {
      selectedTab: 0
    };
  }

  selectTab(index) {
    this.setState({
      selectedTab: index
    });
  }

  getNewCondition = () => {
    return {
      param: '',
      operation: '',
      value: ''
    };
  };

  addRule = (channel, conditions = [this.getNewCondition()], callback) => {
    const {attributionMappingRules} = this.props;
    attributionMappingRules.push({
      conditions,
      channel
    });
    this.props.updateState({attributionMappingRules}, callback);
  };

  render() {
    const childrenWithProps = React.Children.map(this.props.children,
      (child) => React.cloneElement(child, {
        ...this.props,
        addRule: this.addRule,
        getNewCondition: this.getNewCondition
      }));

    return <div>
      <Page contentClassName={this.classes.content}
            innerClassName={this.classes.pageInner}
            className={this.classes.static}
            width="100%">
        <div className={this.classes.head}>
          <div className={this.classes.headTitle}>Channels</div>
        </div>
        <div className={this.classes.wrap}>
          {childrenWithProps}
        </div>
      </Page>
    </div>;
  }
}