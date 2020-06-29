import React from 'react';
import Component from 'components/Component';
import Page from 'components/Page';
import style from 'styles/users/users-popup.css';
import ReactCountryFlag from 'react-country-flag';
import {getNickname as getChannelNickname} from 'components/utils/channels';
import {getNickname as getIndicatorNickname} from 'components/utils/indicators';
import Popup from 'components/Popup';
import {isEmpty, sortBy} from 'lodash';
import ReactDOM from 'react-dom';

export default class UsersPopup extends Component {

  style = style;

  constructor(props) {
    super(props);
    this.state = {
      showOtherPagesPopup: null
    };
  }

  static defaultProps = {
    user: {
      user: '',
      accountName: '',
      journey: [],
      countries: []
    }
  };

  componentDidMount() {
    document.addEventListener('mousedown', this.onOutsideClick, true);
    document.addEventListener('touchstart', this.onOutsideClick, true);
    document.addEventListener('keydown', this.handleKeyPress);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.onOutsideClick, true);
    document.removeEventListener('touchstart', this.onOutsideClick, true);
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  onOutsideClick = (e) => {
    const elem = ReactDOM.findDOMNode(this.refs.popup);

    if (elem !== e.target && !elem.contains(e.target)) {
      this.props.close();
    }
  };

  handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      this.props.close();
    }
  };

  stringifyDate(dateString) {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[date.getMonth()] + ' ' + date.getDate() + ' ' + date.getFullYear() + ' at ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
  }

  render() {
    const {user, close} = this.props;
    const {timeSinceFirst, timeSinceLast, emails, countries, devices, displayName, domainIcon, sessions, funnelStages} = user;
    const stagesOrder = {
      MCL: 0,
      MQL: 1,
      SQL: 2,
      opps: 3,
      users: 4
    };

    const channels = sessions && sessions.map((item, index) =>
      <div key={index} className={this.classes.channelBox}>
        <div className={this.classes.icon} data-icon={'plan:' + item.channel}
             style={{width: '40px', height: '40px', margin: '0 5px'}}/>
        <div>
          {item.channel === 'direct' ? 'Direct' : getChannelNickname(item.channel)}
        </div>
      </div>);

    const nonDirectSessions = sessions && sessions.filter(session => session.channel !== 'direct');
    const funnelStageChanges = funnelStages && Object.keys(funnelStages).map(funnelStage => {
      const timestamp = funnelStages[funnelStage];
      const index = stagesOrder[funnelStage];
      return {
        startTime: timestamp,
        endTime: timestamp,
        isFunnelStage: true,
        funnelStage,
        nickname: getIndicatorNickname(funnelStage, true),
        previousFunnelStageNickname: (index && index > 0) ? getIndicatorNickname(Object.keys(stagesOrder)[index - 1], true) : null
      };
    });

    const events = [...(nonDirectSessions || []), ...(funnelStageChanges || [])];
    const sortedEvents = sortBy(events, event => new Date(event.startTime));
    const eventsUI = [];

    sortedEvents.forEach((item, index) => {
      if (item.isFunnelStage) {
        eventsUI.push(<div className={this.classes.eventLine} key={`stage-${index}`}>
          <div className={this.classes.iconCircleSmall} data-icon="event:status"/>
          <div className={this.classes.eventText}>
            Status change - <b>{item.previousFunnelStageNickname ? `${item.previousFunnelStageNickname} > ${item.nickname}` : `${item.nickname} creation`}</b>
            <div className={this.classes.eventTime}>
              {this.stringifyDate(item.startTime)}
              {/*{emails.length > 1 ? ", " + item.email : null}*/}
            </div>
          </div>
        </div>);
      }
      else {
        eventsUI.push(<div className={this.classes.eventLine} key={`channel-${index}`}>
          <div className={this.classes.iconCircle} data-icon={'plan:' + item.channel}/>
          <div className={this.classes.eventText}>
            {item.isOffline ? 'Interacted' : 'Visited website'} through <b>{getChannelNickname(item.channel)}</b>
            <div className={this.classes.eventTime}>
              {this.stringifyDate(item.startTime)}
              {emails && emails.length > 1 ? ', ' + item.email : null}
            </div>
          </div>
        </div>);

        if (!isEmpty(item.pages)) {
          const otherPages = item.pages.slice(1);
          eventsUI.push(<div className={this.classes.eventLine} key={`pages-${index}`}>
            <div className={this.classes.iconCircleSmall} data-icon="event:page"/>
            <div className={this.classes.eventText}>
              {item.pages[0].path + ' '}
              {!isEmpty(otherPages) ?
                <span>
               and other
                <span className={this.classes.otherPages} onClick={() => {
                  this.setState({showOtherPagesPopup: index});
                }}>
                  {' ' + otherPages.length} page/s
                </span>
                <span hidden={this.state.showOtherPagesPopup !== index} style={{position: 'relative'}}>
                  <Popup className={this.classes.otherPagesPopup} onClose={() => {
                    this.setState({showOtherPagesPopup: null});
                  }}>
                    {otherPages.map((item, index) => <div key={index}>{item.path}</div>)}
                  </Popup>
                </span>
              </span>
                : null}
              <div className={this.classes.eventTime}>
                {this.stringifyDate(item.startTime)}
                {emails.length > 1 ? ', ' + item.email : null}
              </div>
            </div>
          </div>);
        }
      }
    });
    return <div>
      <Page popup={true} width="934px" contentClassName={this.classes.content} innerClassName={this.classes.inner}>
        <span ref="popup">
          <div style={{position: 'relative'}}>
            <div className={this.classes.topRight}>
              <div className={this.classes.close} onClick={close}/>
            </div>
          </div>
          <div className={this.classes.container}>
            <div className={this.classes.icon} style={{backgroundImage: domainIcon}}/>
            <div className={this.classes.headerBigText}>
              {displayName}
              <div className={this.classes.headerSmallText}>{emails && emails.length === 1 ? emails[0] :
                <span>
                <span className={this.classes.otherPages} onClick={() => {
                  this.setState({showEmailsPopup: true});
                }}>
                  Users
                </span>
                <span hidden={!this.state.showEmailsPopup} style={{position: 'relative'}}>
                  <Popup className={this.classes.otherPagesPopup} onClose={() => {
                    this.setState({showEmailsPopup: false});
                  }}>
                    {
                      emails && emails.map((item, index) =>
                        <div key={index}>
                          {item}
                          {/*({getIndicatorNickname(funnelStages[item], true)})*/}
                        </div>)
                    }
                  </Popup>
                </span>
              </span>
              }</div>
            </div>
            <div className={this.classes.headerBigText}>
              Stage
              <div className={this.classes.headerSmallText}>
                {funnelStages && Object.keys(funnelStages).map(stage => getIndicatorNickname(stage, true)).join(', ')}
                </div>
            </div>
            <div className={this.classes.headerBigText}>
              First Touch
              <div className={this.classes.headerSmallText}>
                {timeSinceFirst}
              </div>
            </div>
            <div className={this.classes.headerBigText}>
              Last Touch
              <div className={this.classes.headerSmallText}>
                {timeSinceLast}
              </div>
            </div>
            <div className={this.classes.headerBigText}>
              Country
              <div style={{display: 'flex'}}>
              {
                !isEmpty(countries) ?
                  countries.map(item =>
                    <div key={item} className={this.classes.container}
                         style={{height: '20px', width: '45px', marginTop: '5px'}}>
                      <ReactCountryFlag code={item} svg/>
                      <div className={this.classes.headerSmallText} style={{marginLeft: '5px'}}>
                        {item}
                      </div>
                    </div>)
                  : null
              }
              </div>
            </div>
            <div className={this.classes.headerBigText}>
              Device
              <div style={{display: 'flex'}}>
              {
                !isEmpty(devices) ?
                  devices.map(item =>
                    <div key={item} className={this.classes.device} data-icon={'device:' + item}/>)
                  : null
              }
              </div>
            </div>
          </div>
          <div className={this.classes.channels}>
            <div className={this.classes.channelsHeader}>
              Marketing Channels
            </div>
            <div>
              {channels}
            </div>
          </div>
          <div className={this.classes.userJourney}>
            <div className={this.classes.line}/>
            <div className={this.classes.events}>
              {eventsUI.reverse()}
            </div>
          </div>
        </span>
      </Page>
    </div>;
  }

}