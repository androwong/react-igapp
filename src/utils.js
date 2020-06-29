import {getProfileSync} from 'components/utils/AuthService';
import round from 'lodash/round';

export function userPermittedToPage(page) {
  const userProfile = getProfileSync();
  if(userProfile.isAdmin) {
    return true;
  }
  else{
    const blockedPages = userProfile.app_metadata.blockedPages;
    return !blockedPages || blockedPages.findIndex(blockedPage => page === blockedPage) === -1;
  }
}

export function precisionFormat(number) {
  return round(number, 2);
}

export function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}