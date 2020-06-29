import React from 'react';
import PropTypes from 'prop-types';
import Component from 'components/Component';
import style from 'styles/analyze/stage-selector.css';

const stageType = PropTypes.shape({
  stageName: PropTypes.string,
  number: PropTypes.string,
});

export default class StageSelector extends Component {

  style = style;

  static propTypes = {
    selectStage: PropTypes.func,
    selectedIndex: PropTypes.number,
    stages: PropTypes.arrayOf(stageType)
  };

  static defaultProps = {
    stages: []
  };

  render() {
    const {stages, selectedIndex: selected, selectStage} = this.props;

    const stagesDiv = stages.map((stage, index) => {
      return <div key={index} className={this.classes.innerDiv} data-selected={(index === selected) ? true : null}
                  data-before-selected={(index === selected - 1) ? true : null}
                  data-last={(index === stages.length - 1) ? true : null}
                  onClick={() => {
                    selectStage && selectStage(index);
                  }}>
        <div className={this.classes.stageName}>{stage.stageName}</div>
        <div className={this.classes.number}>{stage.number}</div>
      </div>;
    });

    return <div className={this.classes.outerDiv}>{stagesDiv}</div>;
  }
}