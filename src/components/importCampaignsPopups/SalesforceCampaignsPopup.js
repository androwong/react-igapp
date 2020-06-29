import React from 'react';
import Component from 'components/Component';
import Select from 'components/controls/Select';
import style from 'styles/onboarding/onboarding.css';
import serverCommunication from 'data/serverCommunication';
import Label from 'components/ControlsLabel';
import salesForceStyle from 'styles/indicators/salesforce-automatic-popup.css';
import Title from 'components/onboarding/Title';
import CRMStyle from 'styles/indicators/crm-popup.css';
import AuthorizationIntegrationPopup from 'components/common/AuthorizationIntegrationPopup';
import {getTeamMembersOptions} from 'components/utils/teamMembers';
import ChannelsSelect from 'components/common/ChannelsSelect';
import {has} from 'lodash';

export default class SalesforceCampaigns extends Component {

  style = style;
  styles = [salesForceStyle, CRMStyle];

  constructor(props) {
    super(props);
    this.state = {
      selectAll: true,
      types: [],
      statuses: [],
      owners: [],
      campaigns: [],
      campaignsMapping: {
        statuses: {},
        types: {},
        owners: {}
      },
      selectedCampaigns: [],
      tab: 0
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data && nextProps.data.campaignsMapping) {
      this.setState({campaignsMapping: nextProps.data.campaignsMapping});
    }
  }

  selectAll() {
    this.setState({selectAll: !this.state.selectAll}, () => {
      let selectedCampaigns = [];
      if (this.state.selectAll) {
        selectedCampaigns = this.getAllMappedCampaignsIds();
      }
      this.setState({selectedCampaigns: selectedCampaigns});
    });
  }

  afterDataRetrieved = (data) => {
    return new Promise((resolve, reject) => {
      this.setState({
        statuses: data.statuses,
        types: data.types,
        owners: data.owners,
        campaigns: data.campaigns,
        selectedCampaigns: data.campaigns.map(campaign => campaign.Id)
      });
      resolve(true);
    });
  };

  getUserData = () => {
    return new Promise((resolve, reject) => {
      serverCommunication.serverRequest('put',
        'salesforcecampaignsapi',
        JSON.stringify({
          campaignsMapping: this.state.campaignsMapping,
          selectedCampaigns: this.state.selectedCampaigns
        }),
        localStorage.getItem('region'))
        .then((response) => {
          if (response.ok) {
            response.json()
              .then((data) => {
                this.props.setDataAsState(data);
                this.props.close && this.props.close();
                resolve(false);
              });
          }
          else if (response.status == 401) {
            history.push('/');
          }
          else {
            reject(`Error getting salesforce campaigns data`);
          }
        });
    });
  };

  toggleTypeCheckbox = (type) => {
    const campaignsMapping = {...this.state.campaignsMapping};
    if (this.isTypeMapped(type)) {
      delete campaignsMapping.types[type];
    }
    else {
      campaignsMapping.types[type] = '';
    }
    this.setState({campaignsMapping});
  };

  toggleCheckbox(campaignId) {
    let selectedCampaigns = this.state.selectedCampaigns;
    const index = selectedCampaigns.indexOf(campaignId);
    if (index === -1) {
      selectedCampaigns.push(campaignId);
    }
    else {
      selectedCampaigns.splice(index, 1);
    }
    this.setState({selectedCampaigns: selectedCampaigns});
  }

  handleChange = (value, item, type) => {
    const campaignsMapping = {...this.state.campaignsMapping};
    campaignsMapping[type][item] = value;
    this.setState({campaignsMapping: campaignsMapping});
  };

  open = () => {
    this.authPopup.open();
  };

  next = () => {
    const isEmpty = Object.keys(this.refs).some(ref => {
      if (!this.refs[ref].props.selected && !this.refs[ref].props.disabled) {
        this.refs[ref].focus();
        return true;
      }
      return false;
    });
    if (!isEmpty) {
      const selectedCampaigns = this.getAllMappedCampaignsIds();
      this.setState({tab: 1, selectedCampaigns});
    }
  };

  getAllMappedCampaigns = () =>
    this.state.campaigns
      .filter(campaign => this.isTypeMapped(campaign.Type));

  isTypeMapped = type => has(this.state.campaignsMapping, ['types', type]);


  getAllMappedCampaignsIds = () =>
    this.getAllMappedCampaigns()
      .map(campaign => campaign.Id);

  render() {
    const selects = {
      owners: {
        select: {
          name: 'owners',
          options: getTeamMembersOptions(this.props.userAccount.teamMembers)
        }
      },
      statuses: {
        select: {
          name: 'statuses',
          options: [
            {value: 'New', label: 'New'},
            {value: 'Assigned', label: 'Assigned'},
            {value: 'In Progress', label: 'In Progress'},
            {value: 'In Review', label: 'In Review'},
            {value: 'Approved', label: 'Approved'},
            {value: 'Completed', label: 'Completed'},
            {value: 'On Hold', label: 'On Hold'},
            {value: 'Rejected', label: 'Rejected'}
          ]
        }
      }
    };

    const ownersRows = this.state.owners.map((owner, index) =>
      <div className={this.classes.row} key={index}>
        <div className={this.classes.cols}>
          <div className={this.classes.colLeft} style={{flexGrow: 'initial'}}>
            <Label className={salesForceStyle.locals.label}>{owner.Name}</Label>
          </div>
          <div className={this.classes.colCenter} style={{flexGrow: 'initial', margin: 'initial'}}>
            <div className={salesForceStyle.locals.arrow}/>
          </div>
          <div className={this.classes.colRight}>
            <Select {...selects.owners} style={{width: '270px'}} selected={this.state.campaignsMapping.owners[owner.Id]}
                    onChange={(e) => this.handleChange(e.value, owner.Id, 'owners')}/>
          </div>
        </div>
      </div>
    );
    const typesRows = this.state.types.map((type, index) =>
      <div className={this.classes.row} key={index}>
        <div className={this.classes.cols}>
          <div className={this.classes.colLeft} style={{flexGrow: 'initial'}}>
            <Label checkbox={this.isTypeMapped(type.Type)}
                   onChange={() => this.toggleTypeCheckbox(type.Type)}
                   className={salesForceStyle.locals.label}>{type.Type}
            </Label>
          </div>
          <div className={this.classes.colCenter} style={{flexGrow: 'initial', margin: 'initial'}}>
            <div className={salesForceStyle.locals.arrow}/>
          </div>
          <div className={this.classes.colRight}>
            <ChannelsSelect style={{width: '270px'}}
                            selected={this.state.campaignsMapping.types[type.Type]}
                            disabled={!this.isTypeMapped(type.Type)}
                            onChange={(e) => this.handleChange(e.value, type.Type, 'types')}
                            ref={'type' + index}
                            withOtherChannels={true}
                            onNewOptionClick={({value: channel}) => {
                              this.props.addUnknownChannel(channel);
                              this.handleChange(channel, type.Type, 'types');
                            }}/>
          </div>
        </div>
      </div>
    );
    const statusesRows = this.state.statuses.map((status, index) =>
      <div className={this.classes.row} key={index}>
        <div className={this.classes.cols}>
          <div className={this.classes.colLeft} style={{flexGrow: 'initial'}}>
            <Label className={salesForceStyle.locals.label}>{status.Status}</Label>
          </div>
          <div className={this.classes.colCenter} style={{flexGrow: 'initial', margin: 'initial'}}>
            <div className={salesForceStyle.locals.arrow}/>
          </div>
          <div className={this.classes.colRight}>
            <Select {...selects.statuses} style={{width: '270px'}}
                    selected={this.state.campaignsMapping.statuses[status.Status]}
                    onChange={(e) => this.handleChange(e.value, status.Status, 'statuses')}/>
          </div>
        </div>
      </div>
    );
    const campaignsRows = this.getAllMappedCampaigns()
      .map((campaign, index) =>
        <Label
          key={index}
          style={{textTransform: 'capitalize'}}
          checkbox={this.state.selectedCampaigns.includes(campaign.Id)}
          onChange={this.toggleCheckbox.bind(this, campaign.Id)}
        >
          {campaign.Name}
        </Label>
      );
    return <AuthorizationIntegrationPopup ref={ref => this.authPopup = ref}
                                          api='salesforceapi'
                                          afterAuthorizationApi='salesforcecampaignsapi'
                                          afterDataRetrieved={this.afterDataRetrieved}
                                          makeServerRequest={this.getUserData}
                                          width='680px'
                                          innerClassName={salesForceStyle.locals.inner}
                                          contentClassName={salesForceStyle.locals.content}
                                          loadingStarted={this.props.loadingStarted}
                                          loadingFinished={this.props.loadingFinished}
                                          cancelButtonText={this.state.tab !== 0 ? 'Back' : undefined}
                                          cancelButtonAction={this.state.tab !== 0 ? () => {
                                            this.setState({tab: 0});
                                          } : null}
                                          doneButtonText={this.state.tab === 0 ? 'Next' : undefined}
                                          doneButtonAction={this.state.tab === 0 ? this.next : null}
                                          platformTitle='Salesforce'

    >
      {this.state.tab === 0 ?
        <div>
          <Title title="SalesForce - map fields"/>
          <div className={this.classes.row}>
            <Label style={{fontSize: '20px'}}>Owners</Label>
          </div>
          {ownersRows}
          <div className={this.classes.row}>
            <Label style={{fontSize: '20px'}}>Types / Channels</Label>
          </div>
          {typesRows}
          <div className={this.classes.row}>
            <Label style={{fontSize: '20px'}}>Statuses</Label>
          </div>
          {statusesRows}
        </div>
        :
        <div>
          <Title title="SalesForce - Import Campaigns"/>
          <div className={this.classes.row}>
            <Label style={{fontSize: '20px'}}>Choose which campaigns to import</Label>
          </div>
          <div className={this.classes.row}>
            <Label
              style={{textTransform: 'capitalize'}}
              checkbox={this.state.selectAll}
              onChange={this.selectAll.bind(this)}
            >
              Select All
            </Label>
          </div>
          {campaignsRows}
        </div>
      }
    </AuthorizationIntegrationPopup>;
  }
};