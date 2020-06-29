import React from 'react';
import Component from 'components/Component';

import calendarStyle from 'rc-calendar/assets/index.css';
import RcCalendar from 'rc-calendar';
import DatePicker from 'rc-calendar/lib/Picker';
import moment from 'moment';
import _CalendarLocale from 'rc-calendar/lib/locale/en_US';

import Textfield from 'components/controls/Textfield';

import style from 'styles/controls/calendar.css';
const format = 'MM-DD-YYYY';

const now = moment();

const defaultCalendarValue = now.clone();
defaultCalendarValue.add(-1, 'month');

const CalendarLocale = Object.assign({ }, _CalendarLocale, {
  monthFormat: 'MMMM',
});

export default class Calendar extends Component {
  style = style;
  styles = [calendarStyle];
  state = {
    value: null,
    open: false
  }

  focus() {
    this.textfield.focus();
    this.openCalendar();
  }

  onChange = (value) => {
    this.setState({ value });

    if (this.props.onChange) {
      this.props.onChange(moment(value).format(format));
    }
  }

  openCalendar = () => {
    this.refs.picker.onVisibleChange(true);
  }

  render() {
    const calendar = (
      <RcCalendar
        locale={ CalendarLocale }
        style={{ zIndex: 1000 }}
        format={ format }
        disabledTime={ null }
        timePicker={ null }
        defaultValue={ this.props.value ? moment(this.props.value, format) : defaultCalendarValue }
        showDateInput={ false }
        disabledDate={ disabledDate }
      />
    );

    let inputClassName = this.classes.input;

    if (this.props.inputClassName) {
      inputClassName += ' ' + this.props.inputClassName;
    }

    return <div className={ this.classes.box }>
      <DatePicker
        ref="picker"
        disabled={ this.props.disabled }
        calendar={ calendar }
        value={ this.state.value }
        onChange={ this.onChange }
        defaultValue={ this.props.value ? moment(this.props.value, format) : defaultCalendarValue }
      >
        {() => (
          <Textfield
            ref={ (t) => { this.textfield = t; } }
            className={ inputClassName }
            onClick={ this.openCalendar }
            readOnly
            value={ this.props.value }
            placeHolder={ this.props.placeholder }
            disabled={ this.props.disabled }
          />
        )}
      </DatePicker>
      <div className={ this.classes.icon } onClick={ this.openCalendar } />
    </div>
  }
}

function disabledDate(current) {
  if (!current) {
    // allow empty select
    return false;
  }

  const now = moment({hour: 0, minute: 0, seconds: 0, milliseconds: 0});

  return now.diff(current, 'years') > 10;  // can not select days before today
}