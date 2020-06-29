import React from 'react';
import Component from 'components/Component';

import style from 'styles/popup.css';
import assign from 'object-assign';

import ReactDOM from 'react-dom';

export default class Popup extends Component {
  style = style;

  constructor(props) {
    super(props);

    this.state = {
      hidden: !!props.hidden
    };
  }

  render() {
    const classes = [this.classes.popup];

    if (this.props.className) {
      classes.push(this.props.className);
    }

    const style = assign({}, this.props.style);

    if (this.state.hidden) {
      this.unlistenGlobal();
      style.display = 'none';
    } else {
      style.display = '';
      this.listenGlobal();
    }

    return <div className={ classes.join(' ') } style={ style }>
      { this.props.children }
    </div>
  }

  onOutsideClick = (e) => {
    if (this.props.onClose) {
      const elem = ReactDOM.findDOMNode(this);

      if (elem !== e.target && !elem.contains(e.target)) {
        this.props.onClose();
      }
    }
  }

  close() {
    this.props.onClose();
  }

  hide() {
    this.setState({
      hidden: true
    });
  }

  listenGlobal() {
    document.addEventListener('mousedown', this.onOutsideClick, true);
    document.addEventListener('touchstart', this.onOutsideClick, true);
  }

  unlistenGlobal() {
    document.removeEventListener('mousedown', this.onOutsideClick, true);
    document.removeEventListener('touchstart', this.onOutsideClick, true);
  }

  componentWillReceiveProps(props) {
    if (props.hidden !== this.state.hidden) {
      this.setState({
        hidden: props.hidden
      });
    }
  }

  componentWillUnmount() {
    this.unlistenGlobal();
  }
}