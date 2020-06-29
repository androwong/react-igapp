import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route} from 'react-router';
import history from 'history';
import Navigate from 'components/pages/dashboard/navigate/Navigate';
import CMO from 'components/pages/dashboard/CMO';
import Dashboard from './components/pages/Dashboard';
import Product from './components/pages/Product';
import Welcome from './components/pages/Welcome';
import Preferences from './components/pages/Preferences';
import TargetAudience from './components/pages/TargetAudience';
import Platforms from './components/pages/Platforms';
import TechnologyStack from './components/pages/TechnologyStack';
import Indicators from './components/pages/Indicators';
import Manual from './components/pages/Manual';
import SignIn from './components/pages/SignIn';
import Campaigns from './components/pages/Campaigns';
import Attribution from './components/pages/Attribution';
import Users from './components/pages/Users';
import Trustability from './components/pages/Trustability';
import Plan from './components/pages/Plan';
import {
  isAuthenticated,
  logout,
  handleAuthentication,
  getProfileSync,
  crossOriginVerification
} from './components/utils/AuthService';
import App from './components/App';
import PlannedVsActual from './components/pages/PlannedVsActual';
import style from 'styles/global/main.css';
import Analyze from './components/pages/Analyze';
import Overview from 'components/pages/analyze/Overview';
import Content from 'components/pages/analyze/Content';
import Channels from 'components/pages/analyze/Channels';
import CampaignsMeasure from 'components/pages/analyze/Campaigns';
import Setup from 'components/pages/attribution/Setup';
import AttributionLink from 'components/pages/AttributionLink';
import TrackingUrls from 'components/pages/attribution/TrackingUrls';
import Offline from 'components/pages/attribution/Offline';
import SiteStructure from 'components/pages/attribution/SiteStructure';
import AnnualTab from 'components/pages/plan/AnnualTab';
import ByChannelTab from 'components/pages/campaigns/ByChannelTab';
import ByStatusTab from 'components/pages/campaigns/ByStatusTab';
import IdeasTab from 'components/pages/campaigns/Ideas';
import OnlineTab from 'components/pages/campaigns/OnlineCampaigns';
import Settings from 'components/pages/Settings';
import {userPermittedToPage} from 'utils';
import config from 'components/utils/Configuration';
import Login from 'components/pages/signIn/Login';
import ForgotPassword from 'components/pages/signIn/ForgotPassword';
import ManualPlan from 'components/pages/ManualPlan';
import NoAnalyzeData from 'components/pages/analyze/NoAnalyzeData';
import Expenses from 'components/pages/campaigns/Expenses';
import AddExpensePopup from 'components/pages/campaigns/AddExpensePopup';
import ChannelsSettings from 'components/pages/settings/channels/Channels';
import ChannelsTab from 'components/pages/settings/channels/tabs/ChannelsTab';
import UnmappedTab from 'components/pages/settings/channels/tabs/UnmappedTab';

style.use();

// validate authentication for private routes
const requireAdminAuth = (nextState, replace) => {
  if (!isAuthenticated() || !getProfileSync().app_metadata || !getProfileSync().app_metadata.isAdmin) {
    logout();
    replace({pathname: '/'});
  }
};

// validate authentication for private routes
const requireAuth = (nextState, replace) => {
  if (!isAuthenticated()) {
    replace({pathname: '/'});
  }
};

// Validate permission on the page
const requirePermission = (page, nextState, replace) => {
  if (!isAuthenticated() || !getProfileSync().app_metadata) {
    replace({pathname: '/'});
  }
  else if (!userPermittedToPage(page)) {
    replace({pathname: '/campaigns/by-channel'});
  }
};

const onUpdate = () => {
  window.scrollTo(0, 0);
  if (config.sendEvents && analytics) {
    analytics.page();
    analytics.identify(getProfileSync().email);
  }
};

ReactDOM.render(
  <Router onUpdate={onUpdate} history={history}>
    <Route path='/login' component={Login}/>
    <Route path='/forgotPassword' component={ForgotPassword}/>
    <Route path="/" component={SignIn} onEnter={handleAuthentication}/>
    <Route path="/loginCallBack" onEnter={crossOriginVerification}/>
    <Route component={App} onEnter={requireAuth}>
      <Route component={Dashboard} onEnter={(...parameters) => requirePermission('dashboard', ...parameters)}>
        <Route path="/dashboard/navigate" component={Navigate} onEnter={requireAuth} tabName='Navigate'/>
        <Route path="/dashboard/CMO" component={CMO} onEnter={requireAuth} tabName='CMO'/>
        <Route path="/dashboard/metrics" component={Indicators} onEnter={requireAuth} tabName='Metrics'/>
      </Route>
      <Route path="/profile/technology-stack" component={TechnologyStack} onEnter={requireAdminAuth}/>
      <Route path="/manual" component={Manual} onEnter={requireAdminAuth}/>
      <Route path="/build-first-plan" component={ManualPlan} onEnter={requireAdminAuth}/>
      <Route component={Plan} onEnter={(...parameters) => requirePermission('plan', ...parameters)}>
        <Route path="/plan/annual" component={AnnualTab} onEnter={requireAuth} tabName='Annual'/>
        <Route path="/plan/plans-vs-actuals"
               component={PlannedVsActual}
               onEnter={requireAuth}
               tabName="Plans vs Actuals"/>
      </Route>
      <Route component={Campaigns} onEnter={requireAuth}>
        <Route path="/campaigns/by-status" component={ByStatusTab} onEnter={requireAuth} tabName='By Status'/>
        <Route path="/campaigns/by-channel" component={ByChannelTab} onEnter={requireAuth} tabName='By Channel'/>
        <Route path="/campaigns/online-performance"
               component={OnlineTab}
               onEnter={requireAuth}
               tabName='Online Performance'/>
        <Route path="/campaigns/ideas" component={IdeasTab} onEnter={requireAuth} tabName='Ideas'/>
        <Route path="/campaigns/expenses" component={Expenses} onEnter={requireAuth} tabName='Expenses'/>
      </Route>
      <Route path="/campaigns/add-expense" component={AddExpensePopup} onEnter={requireAuth}/>
      <Route component={Settings} onEnter={requireAuth}>
        <Route path="/settings/account" component={Welcome} onEnter={requireAuth}/>
        <Route component={Attribution} onEnter={requireAuth}>
          <Route path="/settings/attribution/setup" component={Setup} onEnter={requireAuth} tabName='Setup'/>
          <Route path="/settings/attribution/tracking-urls"
                 component={TrackingUrls}
                 onEnter={requireAuth}
                 tabName='Campaign URLs'/>
          <Route path="/settings/attribution/offline" component={Offline} onEnter={requireAuth} tabName='Offline'/>
          <Route path="/settings/attribution/site-structure"
                 component={SiteStructure}
                 onEnter={requireAuth}
                 tabName='Site Structure'/>
        </Route>
        <Route path="/settings/profile/product" component={Product} onEnter={requireAuth}/>
        <Route path="/settings/profile/preferences"
               component={Preferences}
               onEnter={requireAuth}/>
        <Route path="/settings/profile/target-audience"
               component={TargetAudience}
               onEnter={requireAuth}/>
        <Route path="/settings/profile/integrations"
               component={Platforms}
               onEnter={requireAuth}/>
        <Route component={ChannelsSettings} onEnter={requireAuth}>
          <Route path="/settings/channels/channels"
                 component={ChannelsTab}
                 onEnter={requireAuth}
                 tabName='Channels'/>
          <Route path="/settings/channels/unmapped"
                 component={UnmappedTab}
                 onEnter={requireAuth}
                 tabName='Unmapped'/>
        </Route>
      </Route>
      <Route component={Analyze} onEnter={(...parameters) => requirePermission('analyze', ...parameters)}>
        <Route path="/analyze/overview" component={Overview} onEnter={requireAuth} tabName='Overview'/>
        <Route path="/analyze/channels" component={Channels} onEnter={requireAuth} tabName='Channels'/>
        <Route path="/analyze/campaigns" component={CampaignsMeasure} onEnter={requireAuth} tabName='Campaigns'/>
        <Route path="/analyze/content" component={Content} onEnter={requireAuth} tabName='Content'/>
        <Route path="/analyze/audiences" component={Users} onEnter={requireAuth} tabName='Audiences'/>
      </Route>
      <Route path="/no-analyze-data" component={NoAnalyzeData} onEnter={requireAdminAuth}/>
      <Route path="/trustability" component={Trustability} onEnter={requireAdminAuth}/>
    </Route>
    <Route component={AttributionLink} path='/attribution/:UID'></Route>
  </Router>,
  document.querySelector('#main')
);