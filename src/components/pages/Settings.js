import React from 'react';
import Component from 'components/Component';
import Page from 'components/Page';
import style from 'styles/plan/plan.css';
import SettingsSideBar from 'components/pages/settings/SettingsSideBar';
import {userPermittedToPage} from 'utils';

export default class Settings extends Component {

  style = style;

  render() {

    const {children, ...otherProps} = this.props;
    const childrenWithProps = React.Children.map(children,
      (child) => React.cloneElement(child, otherProps));

    return <div>
      <Page contentClassName={this.classes.content} innerClassName={this.classes.pageInner} width="100%">
        {userPermittedToPage('settings')
          ? <div>
              <SettingsSideBar currentPath={this.props.location.pathname}/>
              <div>
                {childrenWithProps}
              </div>
            </div>
          : <div>
              {childrenWithProps}
            </div>
        }
      </Page>
    </div>;
  }
}