import React from 'react';
import Component from 'components/Component';
import names from 'classnames';
import Button from 'components/controls/Button';

import _Popup from 'components/Popup';
import style from 'styles/plan/popup.css';

export default class Popup extends Component {
  style = style

  constructor(props) {
    super(props);

    this.state = {
      visible: this.props.defaultVisible || false
    };
  }

  open = () => {
    this.setState({
      visible: true
    });
  }

  close = () => {
    this.setState({
      visible: false
    });

    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  render() {
    const className = names(this.classes.popup, this.props.className);
    return <_Popup { ... this.props } onClose={ null } className={ className } hidden={ !this.state.visible }>
      <div className={ this.classes.header }>
        <div className={ this.classes.title }>
          { this.props.title }
        </div>
        <div className={ this.classes.close }
             role="button"
             onClick={ this.close }
             hidden={ this.props.hideClose }
        ></div>
      </div>
      <div hidden={ !this.props.hideClose }>
        <Button className={ this.classes.hide }
                type="secondary"
                role="button"
                onClick={ this.close }
        >Hide</Button>
      </div>
      <div className={ this.classes.content }>
        { this.props.children }
      </div>
    </_Popup>
  }
}

export class TextContent extends Component {
  style = style;

  render() {
    return <div className={ this.classes.textContent }>
      { this.props.children }
    </div>
  }
}