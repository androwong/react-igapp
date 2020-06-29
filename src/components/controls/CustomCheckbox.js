import React from 'react';
import PropTypes from 'prop-types';
import Component from 'components/Component';
import style from 'styles/controls/custom-checkbox.css';

export default class CustomCheckbox extends Component {

  style = style;

  static propTypes = {
    children: PropTypes.node,
    onChange: PropTypes.func.isRequired,
    style: PropTypes.object,
    checkboxStyle: PropTypes.object,
    checked: PropTypes.bool
  };

  static defaultProps = {
    checked: false
  };

  render() {
    const {style, checkboxStyle, checked, children, onChange} = this.props;
    return <div className={this.classes.container} style={style}>
      <div className={this.classes.checkbox} style={checkboxStyle} data-checked={checked ? true : null}>
        <div className={this.classes.checkMark} hidden={!checked}
             data-icon={this.props.checkedIcon || 'checkbox:checked'}/>
        <input type='checkbox' className={this.classes.input} checked={checked} onChange={onChange}/>
      </div>
      <div className={this.classes.children} data-checked={checked ? true : null}>
        {children}
      </div>
    </div>;
  }
}

