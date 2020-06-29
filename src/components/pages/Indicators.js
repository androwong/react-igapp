import React from 'react';
import Component from 'components/Component';
import Page from 'components/Page';
import Title from 'components/onboarding/Title';
import ProfileProgress from 'components/pages/profile/Progress';
import BackButton from 'components/pages/profile/BackButton';
import NextButton from 'components/pages/profile/NextButton';
import Item from 'components/pages/indicators/Item';
import style from 'styles/onboarding/onboarding.css';
import indiStyle from 'styles/indicators/indicators.css';
import {isPopupMode, disablePopupMode} from 'modules/popup-mode';
import history from 'history';
import FacebookAutomaticPopup from 'components/pages/indicators/FacebookAutomaticPopup';
import CRMPopup from 'components/pages/indicators/CRMPopup';
import AnalyticsPopup from 'components/pages/indicators/AnalyticsPopup';
import FinancePopup from 'components/pages/indicators/FinancePopup';
import SocialPopup from 'components/pages/indicators/SocialPopup';
import TwitterAutomaticPopup from 'components/pages/indicators/TwitterAutomaticPopup';
import Loading from 'components/pages/indicators/Loading';
import {getIndicatorsWithProps} from 'components/utils/indicators';
import MozAutomaticPopup from './indicators/MozAutomaticPopup';
import YoutubeAutomaticPopup from 'components/pages/indicators/YoutubeAutomaticPopup';

export default class Indicators extends Component {

  style = style;
  styles = [indiStyle];

  static defaultProps = {
    actualIndicators: {},
    userAccount: {}
  };

  constructor(props) {
    super(props);
    this.state = {
      loading: false
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(name, value) {
    let update = Object.assign({}, this.props.actualIndicators);
    value = parseInt(value);
    if (!isNaN(value)) {
      update[name] = value;
      this.props.updateUserMonthPlan({actualIndicators: update}, this.props.region, this.props.planDate);
    }
  }

  showFacebookPopup() {
    this.setState({showFacebookPopup: true});
  }

  showCRMPopup() {
    this.setState({showCRMPopup: true});
  }

  showAnalyticsPopup() {
    this.setState({showAnalyticsPopup: true});
  }

  showFinancePopup() {
    this.setState({showFinancePopup: true});
  }

  showSocialPopup() {
    this.setState({showSocialPopup: true});
  }

  showTwitterPopup() {
    this.setState({showTwitterPopup: true});
  }

  showMozPopup() {
    this.setState({showMozPopup: true});
  }

  showYoutubePopup() {
    this.setState({showYoutubePopup: true});
  }

  isFunnelAuto(indicator) {
    if (this.props.calculatedData.integrations.isHubspotAuto && this.props.hubspotapi.mapping[indicator]) {
      return 'provider:hubspot';
    }
    if (this.props.calculatedData.integrations.isSalesforceAuto && this.props.salesforceapi.mapping[indicator]) {
      return 'provider:salesforce';
    }
    return false;
  }

  isSheetAuto(indicator) {
    return this.props.calculatedData.integrations.isGoogleSheetsAuto && this.props.googlesheetsapi.mapping[indicator];
  }

  isFinanceAuto(indicator) {
    if (this.isSheetAuto(indicator)) {
      return 'provider:sheets';
    }
    if (this.props.calculatedData.integrations.isStripeAuto) {
      return 'provider:stripe';
    }
    return false;
  }

  isMrrAuto = () => {
    return this.isFinanceAuto('MRR') || (this.props.salesforceapi && this.props.salesforceapi.isMRRAuto);
  };

  isBlogAuto() {
    return this.props.googleapi && this.props.googleapi.blogProfileId;
  }

  updateState = (newState) => {
    this.setState(newState);
  };

  render() {
    const {actualIndicators, calculatedData: {integrations: {isFacebookAuto, isTwitterAuto, isLinkedinAuto, isYoutubeAuto, isMozAuto, isGoogleAuto}}} = this.props;
    const indicatorsSpecialProp = {
      facebookLikes: {
        showAutomaticPopup: this.showFacebookPopup.bind(this),
        automaticIndicators: isFacebookAuto
      },
      facebookEngagement: {
        showAutomaticPopup: this.showFacebookPopup.bind(this),
        automaticIndicators: isFacebookAuto
      },
      twitterFollowers: {
        showAutomaticPopup: this.showTwitterPopup.bind(this),
        automaticIndicators: isTwitterAuto
      },
      twitterEngagement: {
        showAutomaticPopup: this.showTwitterPopup.bind(this),
        automaticIndicators: isTwitterAuto
      },
      linkedinFollowers: {
        showAutomaticPopup: this.showSocialPopup.bind(this),
        automaticIndicators: isLinkedinAuto
      },
      linkedinEngagement: {
        showAutomaticPopup: this.showSocialPopup.bind(this),
        automaticIndicators: isLinkedinAuto
      },
      youtubeSubscribers: {
        showAutomaticPopup: this.showYoutubePopup.bind(this),
        automaticIndicators: isYoutubeAuto
      },
      youtubeEngagement: {
        showAutomaticPopup: this.showYoutubePopup.bind(this),
        automaticIndicators: isYoutubeAuto
      },
      MCL: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('MCL'),
        isFunnel: true
      },
      MQL: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('MQL'),
        isFunnel: true
      },
      SQL: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('SQL'),
        isFunnel: true
      },
      opps: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('opps'),
        isFunnel: true
      },
      newMCL: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('MCL'),
        isFunnel: true
      },
      newMQL: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('MQL'),
        isFunnel: true
      },
      newSQL: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('SQL'),
        isFunnel: true
      },
      newOpps: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('opps'),
        isFunnel: true
      },
      leadToMQLVelocity: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('MCL') && this.isFunnelAuto('MQL')
      },
      MQLToSQLVelocity: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('MQL') && this.isFunnelAuto('SQL')
      },
      SQLToOppVelocity: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('SQL') && this.isFunnelAuto('opps')
      },
      oppToAccountVelocity: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('opps') && this.isFunnelAuto('users')
      },
      averageSalesCycle: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('MCL') && this.isFunnelAuto('users')
      },
      leadToMQLConversionRate: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('MCL') && this.isFunnelAuto('MQL')
      },
      MQLToSQLConversionRate: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('MQL') && this.isFunnelAuto('SQL')
      },
      SQLToOppConversionRate: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('SQL') && this.isFunnelAuto('opps')
      },
      OppToAccountConversionRate: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('opps') && this.isFunnelAuto('users')
      },
      leadToAccountConversionRate: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('MCL') && this.isFunnelAuto('users')
      },
      LTV: {
        showAutomaticPopup: this.showFinancePopup.bind(this),
        automaticIndicators: this.isFinanceAuto('LTV')
      },
      CAC: {
        showAutomaticPopup: this.showFinancePopup.bind(this),
        automaticIndicators: this.isSheetAuto('CAC') || (this.props.salesforceapi && this.props.salesforceapi.isCACAuto)
      },
      users: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('users')
      },
      newUsers: {
        showAutomaticPopup: this.showCRMPopup.bind(this),
        automaticIndicators: this.isFunnelAuto('users')
      },
      domainAuthority: {
        showAutomaticPopup: this.showMozPopup.bind(this),
        automaticIndicators: isMozAuto
      },
      sessions: {
        showAutomaticPopup: this.showAnalyticsPopup.bind(this),
        automaticIndicators: isGoogleAuto
      },
      averageSessionDuration: {
        showAutomaticPopup: this.showAnalyticsPopup.bind(this),
        automaticIndicators: isGoogleAuto
      },
      bounceRate: {
        showAutomaticPopup: this.showAnalyticsPopup.bind(this),
        automaticIndicators: isGoogleAuto
      },
      blogVisits: {
        showAutomaticPopup: this.showAnalyticsPopup.bind(this),
        automaticIndicators: this.isBlogAuto()
      },
      blogSubscribers: {
        automaticIndicators: this.isFunnelAuto('blogSubscribers')
      },
      MRR: {
        showAutomaticPopup: this.showFinancePopup.bind(this),
        automaticIndicators: this.isMrrAuto()
      },
      ARR: {
        showAutomaticPopup: this.showFinancePopup.bind(this),
        automaticIndicators: this.isMrrAuto()
      },
      churnRate: {
        showAutomaticPopup: this.showFinancePopup.bind(this),
        automaticIndicators: this.isFinanceAuto('churnRate')
      }
    };
    let groups = [];
    const properties = getIndicatorsWithProps() || {};
    const indicators = Object.keys(properties);
    indicators.forEach(indicator => {
      if (!groups.includes(properties[indicator].group)) {
        groups.push(properties[indicator].group);
      }
    });
    groups.sort();

    const page = groups.map(group => {
      const groupIndicators = indicators
        .filter(indicator => properties[indicator].group === group)
        .sort((a, b) => properties[a].orderInGroup - properties[b].orderInGroup);
      const indicatorsItems = groupIndicators.map(indicator =>
        <Item
          key={indicator}
          icon={'indicator:' + indicator}
          title={properties[indicator].title}
          name={indicator}
          updateIndicator={this.handleChange}
          defaultStatus={actualIndicators[indicator]}
          maxValue={properties[indicator].range.max}
          isPercentage={properties[indicator].isPercentage}
          description={properties[indicator].description}
          formula={properties[indicator].formula}
          timeframe={properties[indicator].timeframe}
          isDirectionDown={!properties[indicator].isDirectionUp}
          {... indicatorsSpecialProp[indicator]}
        />
      );
      return <div className={indiStyle.locals.row} key={group}>
        {indicatorsItems}
      </div>;
    });
    return <div className={indiStyle.locals.wrap}>
      <FacebookAutomaticPopup hidden={!this.state.showFacebookPopup} setDataAsState={this.props.setDataAsState}
                              close={() => {
                                this.setState({showFacebookPopup: false});
                              }}/>
      <TwitterAutomaticPopup hidden={!this.state.showTwitterPopup} setDataAsState={this.props.setDataAsState}
                             close={() => {
                               this.setState({showTwitterPopup: false});
                             }}/>
      <MozAutomaticPopup hidden={!this.state.showMozPopup} setDataAsState={this.props.setDataAsState} close={() => {
        this.setState({showMozPopup: false});
      }} defaultUrl={this.props.mozapi ? this.props.mozapi.url : this.props.userAccount.companyWebsite}/>
      <CRMPopup hidden={!this.state.showCRMPopup} close={() => {
        this.setState({showCRMPopup: false});
      }} setDataAsState={this.props.setDataAsState} updateState={this.updateState}
                salesforceapi={this.props.salesforceapi} hubspotapi={this.props.hubspotapi}/>
      <AnalyticsPopup hidden={!this.state.showAnalyticsPopup} close={() => {
        this.setState({showAnalyticsPopup: false});
      }} setDataAsState={this.props.setDataAsState} googleapi={this.props.googleapi}/>
      <FinancePopup hidden={!this.state.showFinancePopup} close={() => {
        this.setState({showFinancePopup: false});
      }} setDataAsState={this.props.setDataAsState} googlesheetsapi={this.props.googlesheetsapi}/>
      <SocialPopup hidden={!this.state.showSocialPopup} close={() => {
        this.setState({showSocialPopup: false});
      }} setDataAsState={this.props.setDataAsState}/>
      <YoutubeAutomaticPopup hidden={!this.state.showYoutubePopup} setDataAsState={this.props.setDataAsState}
                             close={() => {
                               this.setState({showYoutubePopup: false});
                             }}/>
      {/*<Loading hidden={ !this.state.loading }/>*/}
      <div className={this.classes.cols}>
        <div className={this.classes.colLeft}>
          {page}
        </div>

        {isPopupMode() ?

          <div className={this.classes.colRight}>
            <div className={this.classes.row}>
              <ProfileProgress progress={76} image={
                require('assets/flower/4.png')
              }
                               text="You rock! Hope you’re starting to get excited about planning the right way"/>
            </div>
            {/**
             <div className={ this.classes.row }>
             <ProfileInsights />
             </div>
             **/}
          </div>

          : null}
      </div>

      {isPopupMode() ?

        <div className={this.classes.footer}>
          <BackButton onClick={() => {
            history.push('/profile/target-audience');
          }}/>
          <div style={{width: '30px'}}/>
          <NextButton onClick={() => {
            history.push('/profile/preferences');
          }}/>
        </div>

        :
        <div style={{paddingBottom: '60px'}}/>
      }
    </div>;
  }
}