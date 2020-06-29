import React from 'react';
import Component from 'components/Component';
import style from 'styles/header.css';
import Button from 'components/controls/Button';
import Popup from 'components/Popup';
import global from 'global';
import history from 'history';
import RegionPopup from 'components/RegionPopup';
import Notifications from 'components/pages/header/Notifications';
import Avatar from 'components/Avatar';
import InfiniGrowRobot from 'components/pages/header/InfiniGrowRobot';
import Select from 'components/controls/Select';
import {getIndicatorsWithNicknames, getNickname as getIndicatorNickname} from 'components/utils/indicators';
import Page from 'components/Page';
import InsightItem from 'components/pages/insights/InsightItem';
import merge from 'lodash/merge';
import {getNickname as getChannelNickname} from 'components/utils/channels';
import {formatDate} from 'components/utils/date';
import insightsStyle from 'styles/insights/insights.css';
import {Link} from 'react-router';
import {getProfileSync, logout} from 'components/utils/AuthService';
import PayButton from 'components/PayButton';
import {getMemberFullName} from 'components/utils/teamMembers';

export default class Header extends Component {

  style = style;
  styles = [insightsStyle];

  constructor(props) {
    super(props);
    this.state = {
      dropmenuVisible: false,
      dropmenuVisibleBig: false,
      regionsVisible: false,
      suggestionsVisible: false,
      createNewVisible: false,
      regionsVisibleBig: false,
      regions: []
    };

    this.logout = this.logout.bind(this);
  }

  static defaultProps = {
    user: true,
    regions: [],
    teamMembers: [],
    userAccount: {},
    notifications: [],
    calculatedData: {objectives: {funnelFirstObjective: 'newSQL'}}
  };

  readNotifications() {
    const profile = getProfileSync();
    let notifications = this.props.notifications.slice();
    notifications
      .filter(notification => notification.UID === profile.user_id)
      .map(notification => {
        notification.isRead = true;
        return notification;
      });
    this.props.updateUserMonthPlan({notifications: notifications}, this.state.region, this.state.planDate);
  }

  openSidebar = () => {
    global.dispatchEvent('sidebar:open');
  };

  showDropmenu = () => {
    this.setState({
      dropmenuVisible: true
    });
  };

  // sets always 'true' - toggle prevents from user to select indicator
  toggleSuggestion = () => {
    this.setState({
      suggestionsVisible: true
    });
  };

  toggleDropmenuBig = () => {
    this.setState({
      dropmenuVisibleBig: !this.state.dropmenuVisibleBig
    });
  };

  toggleRegionsBig = () => {
    this.setState({
      regionsVisibleBig: !this.state.regionsVisibleBig
    });
  };

  toggleRegions = () => {
    this.setState({
      regionsVisible: !this.state.regionsVisible
    });
  };

  get menuBig() {
    const profile = getProfileSync();
    const tabs = this.props.tabs.map(({name, path}) => {
      return <Link to={path}
                   activeClassName={this.classes.headTabSelected}
                   className={this.classes.headTab}
                   key={name}>
        {name}
      </Link>;
    });

    const hasUser = this.props.user;

    const regions = hasUser ?
      this.props.regions.map((region) => {
        return <div className={this.classes.linkText}
                    key={region}
                    data-selected={region == this.props.region ? true : null}
                    onClick={this.changeRegion.bind(this, region)}>{region}</div>;
      })
      : null;
    const user = this.props.teamMembers.find(user => user.userId === profile.user_id);

    const userNotifications = this.props.notifications.filter(notification => notification.UID === profile.user_id);
    const isUnreadNotifications = userNotifications.some(notification => notification.isRead === false);
    return <div className={this.classes.menuBig} data-settings-open={this.props.isSettingsOpen}>
      <div className={this.classes.headTabs}>
        {tabs}
      </div>
      <div className={this.classes.itemsBox}>
        <PayButton isPaid={this.props.userAccount.isPaid} pay={this.props.pay}
                   trialEnd={this.props.userAccount.trialEnd}/>
        {/* Hidden Email, so we'll have the user id in customer labs */}
        <div className={this.classes.hiddenEmail}>
          {user && user.email}
        </div>
        {hasUser ?
          <div className={this.classes.dropmenuButton}
               data-selected={this.state.notificationsVisible ? true : null}
               role="button"
               onClick={() => {
                 this.setState({notificationsVisible: !this.state.notificationsVisible});
                 setTimeout(this.readNotifications.bind(this), 20000);
               }}
          >
            <Popup className={this.classes.dropmenuPopup}
                   style={{padding: '0'}}
                   hidden={!this.state.notificationsVisible}
                   onClose={() => {
                     this.setState({
                       notificationsVisible: false
                     });
                   }}
            >
              <Notifications {...this.props} userNotifications={userNotifications}/>
            </Popup>
            <div className={this.classes.headerIcon} data-active={isUnreadNotifications ? true : null}
                 data-icon="header:notification">
            </div>
          </div>
          : null}
        {hasUser ?
          <div className={this.classes.dropmenuButton}
               data-selected={this.state.regionsVisibleBig ? true : null}
               role="button"
               onClick={this.toggleRegionsBig}
          >
            <div className={this.classes.headerIcon} data-icon="header:location">
              <Popup className={this.classes.dropmenuPopup}
                     hidden={!this.state.regionsVisibleBig} ref="regionsPopup" onClose={() => {
                this.setState({
                  regionsVisibleBig: false
                });
              }}>
                {regions}
                <a className={this.classes.linkText}
                   key={'-1'}
                   onClick={() => {
                     this.setState({createNewVisible: true});
                   }}
                   style={{fontWeight: 'bold', color: '#1165A3'}}>+ Add new</a>
              </Popup>
            </div>
          </div>
          : null}
        {/* Remove the robot from the header for now*/}
        {/*{hasUser ?*/}
        {/*<div className={this.classes.dropmenuButton}*/}
        {/*data-selected={this.state.suggestionsVisible ? true : null}*/}
        {/*role="button"*/}
        {/*onClick={this.toggleSuggestion}*/}
        {/*>*/}
        {/*<div className={this.classes.userLogo}*/}
        {/*style={{backgroundImage: this.props.logoURL ? 'url(' + this.props.logoURL + ')' : ''}}>*/}
        {/*<Popup className={this.classes.dropmenuPopup}*/}
        {/*style={{padding: '0'}}*/}
        {/*hidden={!this.state.suggestionsVisible} onClose={() => {*/}
        {/*this.setState({*/}
        {/*suggestionsVisible: false*/}
        {/*});*/}
        {/*}}*/}
        {/*>*/}
        {/*<InfiniGrowRobot company={this.props.userCompany}*/}
        {/*historyData={this.props.beforeInfiniGrowData}*/}
        {/*actualIndicators={this.props.actualIndicators}*/}
        {/*funnelFirstObjective={this.props.calculatedData.objectives.funnelFirstObjective}/>*/}
        {/*<div style={{padding: '12px', backgroundColor: '#E6E6E6', borderTop: '1px solid #273142'}}>*/}
        {/*<div>*/}
        {/*<div style={{display: 'inline-block'}}>*/}
        {/*What action/investment could have the biggest impact on*/}
        {/*</div>*/}
        {/*<Select*/}
        {/*selected={this.state.indicator}*/}
        {/*select={{*/}
        {/*options: getIndicatorsWithNicknames()*/}
        {/*}}*/}
        {/*onChange={(e) => {*/}
        {/*this.setState({indicator: e.value, suggestionsVisible: true});*/}
        {/*}}*/}
        {/*style={{width: '200px', display: 'inline-block', margin: '10px 10px 20px 0'}}*/}
        {/*/>*/}
        {/*<div style={{display: 'inline-block'}}>*/}
        {/*next month?*/}
        {/*</div>*/}
        {/*</div>*/}
        {/*<Button type="normalAccent"*/}
        {/*onClick={() => {*/}
        {/*this.setState({suggestionPopup: true});*/}
        {/*}}*/}
        {/*style={{width: '120px'}}>*/}
        {/*Show me*/}
        {/*</Button>*/}
        {/*</div>*/}
        {/*</Popup>*/}
        {/*</div>*/}
        {/*</div>*/}
        {/*: null}*/}
        <div className={this.classes.dropmenuButton}
             data-selected={this.state.dropmenuVisibleBig ? true : null}
             role="button"
             onClick={this.toggleDropmenuBig}
        >
          <div className={this.classes.dropmenu}>
            <Avatar member={user} className={this.classes.userLogo} withShadow={true}/>
            <div className={this.classes.userDetails}>
              <div className={this.classes.user}>
                {user ? getMemberFullName(user) : ''}
              </div>
              <div className={this.classes.userCompany}>
                {this.props.userCompany}
              </div>
            </div>
            <div className={this.classes.triangle}/>
            <Popup className={this.classes.dropmenuPopup}
                   hidden={!this.state.dropmenuVisibleBig} onClose={() => {
              this.setState({
                dropmenuVisibleBig: false
              });
            }}
            >
              <a className={this.classes.linkText} href="http://infinigrow.com/company/" target="_blank">About</a>
              {/** <a className={ this.classes.linkText } href="#">Chat</a> **/}
              <a className={this.classes.linkText} href="http://infinigrow.com/contact/" target="_blank">Contact</a>
              <a className={this.classes.linkText}
                 href="mailto:support@infinigrow.com?&subject=Support Request"
                 target="_blank">Support</a>
              <div className={this.classes.linkText} onClick={this.logout} style={{color: '#2571AB'}}>
                Logout
                <div className={this.classes.logOutIcon} data-icon="header:log-out"/>
              </div>
            </Popup>
          </div>
        </div>
      </div>
    </div>;
  }

  get menuSmall() {
    const profile = getProfileSync();
    const hasUser = this.props.user;
    const regions = hasUser ?
      this.props.regions.map((region) => {
        return <div className={this.classes.linkText}
                    key={region}
                    data-selected={region == this.props.region ? true : null}
                    onClick={this.changeRegion.bind(this, region)}>{region}</div>;
      })
      : null;
    const user = this.props.teamMembers.find(user => user.userId === profile.user_id);
    return <div className={this.classes.menuSmall}>
      <div className={this.classes.itemsBox}>
        {hasUser ?
          <div className={this.classes.logoutItemOutside}>
            <Button type="secondary" onClick={this.logout} style={{
              width: '120px'
            }}>
              Log Out
              <div className={this.classes.logOutIcon} data-icon="header:log-out"/>
            </Button>
          </div>
          : null}
        {hasUser ?
          <div className={this.classes.dropmenuButton}
               data-selected={this.state.regionsVisible ? true : null}
               role="button"
               onClick={this.toggleRegions}
          >
            <div className={this.classes.locationIcon}/>
            <Popup className={this.classes.dropmenuPopup}
                   hidden={!this.state.regionsVisible} ref="regionsPopup">
              {regions}
              <a className={this.classes.linkText}
                 key={'-1'}
                 onClick={() => {
                   this.setState({createNewVisible: true});
                 }}
                 style={{fontWeight: 'bold', color: '#1165A3'}}>+ Add new</a>
            </Popup>
          </div>
          : null}
        <div className={this.classes.dropmenuButton}
             data-selected={this.state.dropmenuVisible ? true : null}
             role="button"
             onClick={this.showDropmenu}
        >
          <div className={this.classes.dropmenuIcon}/>
          <Popup className={this.classes.dropmenuPopup}
                 hidden={!this.state.dropmenuVisible} onClose={() => {
            this.setState({
              dropmenuVisible: false
            });
          }}
          >
            {hasUser ?
              <div className={this.classes.userBoxInside}>
                <div className={this.classes.userLogo}
                     style={{backgroundImage: this.props.logoURL ? 'url(' + this.props.logoURL + ')' : ''}}/>
                <Avatar member={user} className={this.classes.userLogo} withShadow={true}/>
                <div className={this.classes.logged}>
                  {this.props.userCompany}
                  <div className={this.classes.user}>
                    {user && user.name}
                  </div>
                </div>
              </div>
              : null}
            {hasUser ?
              <a className={this.classes.linkText} href="#welcome">
                Settings
              </a>
              : null}
            <a className={this.classes.linkText} href="http://infinigrow.com/company/" target="_blank">About</a>
            {/** <a className={ this.classes.linkText } href="#">Chat</a> **/}
            <a className={this.classes.linkText} href="http://infinigrow.com/contact/" target="_blank">Contact</a>
            <a className={this.classes.linkText}
               href="mailto:support@infinigrow.com?&subject=Support Request"
               target="_blank">Support</a>
            {hasUser ?
              <div className={this.classes.logoutItemInside}>
                <Button type="secondary" onClick={this.logout} style={{
                  width: '120px'
                }}>
                  Log Out
                  <div className={this.classes.logOutIcon} data-icon="header:log-out"/>
                </Button>
              </div>
              : null}
          </Popup>
        </div>
      </div>

      {hasUser ?
        <div className={this.classes.userBoxOutside}>
          <div className={this.classes.userLogo}
               style={{backgroundImage: this.props.logoURL ? 'url(' + this.props.logoURL + ')' : ''}}/>
          <Avatar member={user} className={this.classes.userLogo} withShadow={true}/>
          <div className={this.classes.logged}>
            {this.props.userCompany}
            <div className={this.classes.user}>
              {user ? getMemberFullName(user) : ''}
            </div>
          </div>
        </div>
        : null}
    </div>;
  }

  logout() {
    this.props.updateState({unsaved: false}, () => {
      logout();
      history.push('/');
    });
  }

  changeRegion(region) {
    localStorage.setItem('region', region);
    this.props.getUserMonthPlan(region);
  }

  render() {
    let popup = null;
    if (this.state.suggestionPopup) {

      popup = <Page popup={true}
                    width="825px"
                    contentClassName={insightsStyle.locals.popupContent}
                    innerClassName={insightsStyle.locals.popupInner}>
        <div style={{position: 'relative'}}>
          <div style={{left: 'calc(100% - 20px)', zIndex: '1', top: '5px'}}
               className={insightsStyle.locals.closePopup}
               onClick={() => {
                 this.setState({suggestionPopup: false});
               }}/>
        </div>
      </Page>;
    }
    return <div className={this.classes.box}>
      <div className={this.classes.logoMenu} onClick={this.openSidebar}/>
      <div className={this.classes.logoWrapper} onClick={() => {
        history.push('/dashboard/CMO');
      }}>
        <div className={this.classes.logo}/>
      </div>
      {this.menuBig}
      {this.menuSmall}
      {popup}
      <RegionPopup hidden={!this.state.createNewVisible}
                   close={() => {
                     this.setState({createNewVisible: false});
                   }}
                   createUserMonthPlan={this.props.createUserMonthPlan}/>
    </div>;
  }
}