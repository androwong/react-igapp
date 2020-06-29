import React from 'react';
import Component from 'components/Component';
import Page from 'components/Page';
import style from 'styles/plan/plan.css';

export default class Dashboard extends Component {

  style = style;

  render() {

    const childrenWithProps = React.Children.map(this.props.children,
      (child) => React.cloneElement(child, this.props));
    return <div>
      <Page contentClassName={this.classes.content} innerClassName={this.classes.pageInner} width="100%">
        <div className={this.classes.head}>
          <div className={this.classes.headTitle}>Dashboard</div>
        </div>
        <div>
          {childrenWithProps}
        </div>
      </Page>
    </div>;
  }
}