import React, { Fragment } from 'react';
import Component from 'components/Component';
import style from 'styles/users/users.css';
import ReactCountryFlag from 'react-country-flag';
import {getNickname} from 'components/utils/indicators';
import icons from 'styles/icons/plan.css';
import uniq from 'lodash/uniq';
import UsersPopup from 'components/pages/users/UsersPopup';
import Toggle from 'components/controls/Toggle';
import Table from 'components/controls/Table';

const GROUP_BY = {
  USERS: 0,
  ACCOUNT: 1
};

export default class Users extends Component {

  style = style;
  styles = [icons];

  constructor(props) {
    super(props);
    this.state = {
      showPopup: false,
      groupBy: GROUP_BY.USERS
    };
  }

  toggleUsersAccount = (newValue) => {
    this.setState({
      groupBy: newValue
    });
  };

  timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval + ' years ago';
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval + ' months ago';
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval + ' days ago';
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval + ' hours ago';
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval + ' minutes ago';
    }
    return Math.floor(seconds) + ' seconds ago';
  }

  mode(array) {
    if (array.length === 0)
      return null;
    const modeMap = {};
    let maxEl = array[0], maxCount = 1;
    for (let i = 0; i < array.length; i++) {
      const el = array[i];
      if (modeMap[el] == null)
        modeMap[el] = 1;
      else
        modeMap[el]++;
      if (modeMap[el] > maxCount) {
        maxEl = el;
        maxCount = modeMap[el];
      }
    }
    return maxEl;
  }

  showPopup = (user) => {
    this.setState({
      showPopup: true,
      selectedUser: user,
    });
  }

  render() {
    const {attribution: {usersByEmail, usersByAccount}} = this.props;
    const stagesOrder = {
      blogSubscribers: 0,
      MCL: 1,
      MQL: 2,
      SQL: 3,
      opps: 4,
      users: 5
    };

    const usersData = this.state.groupBy === GROUP_BY.USERS ? usersByEmail : usersByAccount;

    const data = usersData
      .map((user) => {
        const getUniqNotEmpty = field => uniq(user.sessions.map(item => item[field]).filter(item => !!item));
        const firstTouchPoint = new Date(user.sessions[0].startTime);
        const lastTouchPoint = new Date(user.sessions[user.sessions.length - 1].endTime);
        const timeSinceFirst = this.timeSince(firstTouchPoint);
        const timeSinceLast = this.timeSince(lastTouchPoint);
        const uniqChannels = uniq(user.sessions.map(item => item.channel));
        const emails = uniq(user.sessions.map(item => item.email));
        const domain = this.mode(user.sessions.map(item => {
          const domain = item.email && item.email.match('(?<=@).+');
          return domain && domain[0];
        }));
        const devices = getUniqNotEmpty('device');
        const countries = getUniqNotEmpty('country');
        const displayName = user.accountName ? user.accountName : domain && domain.match('[^.]+(?=\\.)') && domain.match('[^.]+(?=\\.)')[0];
        const domainIcon = 'url(https://logo.clearbit.com/' + domain + ')';
        const maxFunnelStageIndex = Math.max(... Object.keys(user.funnelStages).map(stage => stagesOrder[stage]));
        const funnelStage = Object.keys(stagesOrder)[maxFunnelStageIndex];
        const stageNickname = getNickname(funnelStage, true);

        return {
          ...user,
          devices,
          countries,
          timeSinceFirst,
          timeSinceLast,
          lastTouchPoint,
          emails,
          displayName,
          domainIcon,
          uniqChannels,
          stageNickname
        }
      })

    return <div>
      <div className={this.classes.toggle}>
        <Toggle
          options={[{
            text: 'People',
            value: GROUP_BY.USERS
          },
            {
              text: 'Accounts',
              value: GROUP_BY.ACCOUNT
            }
          ]}
          selectedValue={this.state.groupBy}
          onClick={(value) => {
            this.toggleUsersAccount(value);
          }}/>
      </div>
      <div className={this.classes.inner}>
        <Table
          data={data}
          onRowClick={this.showPopup}
          defaultSorted={[{id: 'LastTouch', desc: true}]}
          columns={[
            {
              id: 'User',
              header: 'User',
              cell: ({ emails, displayName, domainIcon }) => (
                <Fragment>
                  <div className={this.classes.icon} style={{
                    backgroundImage: domainIcon,
                    width: '25px',
                    height: '25px',
                    flexShrink: '0',
                  }}/>
                  <div className={this.classes.account}>
                    {displayName}
                    <div className={this.classes.email}>
                      {emails.length <= 1 ? emails && emails[0] : 'multiple users'}
                    </div>
                  </div>
                </Fragment>
              ),
              fixed: 'left',
              minWidth: 200,
            },
            {
              id: 'Channels',
              header: 'Channels',
              cell: ({ uniqChannels }) =>
                uniqChannels.map(item => <div key={item} className={this.classes.icon} data-icon={'plan:' + item}/>),
            },
            {
              id: 'Stage',
              header: 'Stage',
              cell: 'stageNickname',
              minWidth: 80,
            },
            {
              id: 'Sessions',
              header: '# of sessions',
              cell: 'sessions.length',
            },
            {
              id: 'Country',
              header: 'Country',
              cell: ({ countries }) => countries && countries.length > 0 && countries.map((item) => (
                <div key={item} className={this.classes.container}>
                  <ReactCountryFlag code={item} svg/>
                  <div style={{ marginLeft: '5px' }}>{item}</div>
                </div>
              )),
              minWidth: 80,
            },
            {
              id: 'FirstTouch',
              header: 'First touch',
              cell: 'timeSinceFirst',
            },
            {
              id: 'LastTouch',
              header: 'Last touch',
              cell: ({ timeSinceLast }) => timeSinceLast,
              sortable: true,
              sortMethod: (a, b) => a.lastTouchPoint - b.lastTouchPoint,
            },
            {
              id: 'Device',
              header: 'Device',
              cell: ({ devices }) => devices && devices.length > 0 && devices.map((item) => (
                <div key={item} className={this.classes.icon} data-icon={'device:' + item}/>
              )),
              minWidth: 80,
            },
          ]}
        />
      </div>
      <div hidden={!this.state.showPopup}>
        <UsersPopup user={this.state.selectedUser} close={() => {
          this.setState({showPopup: false, selectedUser: {}});
        }}/>
      </div>
    </div>;
  }
}