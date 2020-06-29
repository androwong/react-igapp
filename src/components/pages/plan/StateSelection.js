import React from 'react';
import PropTypes from 'prop-types';
import Component from 'components/Component';
import style from 'styles/plan/state-selection.css';
import cellStyle from 'styles/plan/table-cell.css';
import ReactTooltip from 'react-tooltip';
import {findDOMNode} from 'react-dom';

export default class StateSelection extends Component {

  style = style;
  styles = [cellStyle];

  static propTypes = {
    currentConstraint: PropTypes.string.isRequired,
    changeConstraint: PropTypes.func.isRequired,
    constraintOptions: PropTypes.object.isRequired,
    changeConstraintsBoxOpen: PropTypes.func,
    stateSelectionBoxRef: PropTypes.func,
    boxOpen: PropTypes.bool
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.onOutsideClick, true);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.onOutsideClick, true);
  }

  onOutsideClick = (e) => {
    if (this.props.boxOpen) {
      const domElement = findDOMNode(this.stateSelectionBox);
      if (domElement && e.target !== domElement && !domElement.contains(e.target)) {
        this.closeBox();
      }
    }
  };

  closeBox = () => {
    ReactTooltip.hide(this.refs.iconRef);
    this.props.changeConstraintsBoxOpen(false);
  };

  changeReaction = (key) => {
    this.props.changeConstraint(key);
    this.closeBox();
  };

  getReactionIcon = ({key, text, icon}) => {
    return <div
      key={key}
      className={this.classes.reactionIcon}
      onClick={() => this.changeReaction(key)}
      data-icon={icon}>

      <label className={this.classes.reactionLabel}>{text}</label>
    </div>;
  };

  render() {
    const constraintOptions = Object.keys(this.props.constraintOptions).map(key => {
      return this.getReactionIcon({key: key, ...this.props.constraintOptions[key]});
    });

    const stateSelectionBox = <div>
      <div className={this.classes.stateSelectionBox}>
        {constraintOptions}
      </div>
    </div>;

    return <div className={this.classes.stateSelectionWrap}>
      <ReactTooltip id={'stateSelection' + this.props.cellKey}
                    getContent={() => stateSelectionBox}
                    class={this.classes.tooltip}
                    effect='solid'
                    afterShow={() => this.props.changeConstraintsBoxOpen(true)}
                    afterHide={() => this.props.changeConstraintsBoxOpen(false)}
                    ref={(ref) => {
                      this.stateSelectionBox = ref;
                      this.props.stateSelectionBoxRef(ref);
                    }}/>

      <div className={cellStyle.locals.icon}
           data-icon={this.props.constraintOptions[this.props.currentConstraint].icon}
           data-tip=""
           data-for={'stateSelection' + this.props.cellKey}
           data-event="click"
           data-iscapture="true"
           data-scroll-hide='true'
           ref='iconRef'
      />
    </div>;
  }
}