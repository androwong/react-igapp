import React from 'react';
import PropTypes from 'prop-types';
import { DropTarget } from 'react-dnd';
import { findDOMNode } from 'react-dom';
import Component from 'components/Component';
import DraggableObjectiveView from 'components/pages/preferences/DraggableObjectiveView'

const OBJECTIVE_HEIGHT = 72;
let previousIndex = -1;

const specs = {
  drop(props, monitor, component) {
    const {objectivesData} = component.state;
    let objectives = [...props.objectives];
    objectivesData.forEach(objective => {
      objectives[objective.monthIndex][objective.indicator].target.priority = objective.priority;
    })

    setTimeout(() => props.updateState({objectives}), 500);
  },
  hover(props, monitor, component) {
    
    const itemOffset = monitor.getClientOffset();
    const itemIndex = Math.floor((itemOffset.y - findDOMNode(component).getBoundingClientRect().y) / OBJECTIVE_HEIGHT);

    if(itemIndex !== previousIndex && itemIndex < props.objectivesData.length && itemIndex >= 0){
      let objectivesData = [...component.state.objectivesData]
      let previousItemIndex = objectivesData.indexOf(objectivesData.find(objective => objective.indicator === monitor.getItem().indicator));
      
      let temp = objectivesData[itemIndex].priority;
      objectivesData[itemIndex].priority = objectivesData[previousItemIndex].priority;
      objectivesData[previousItemIndex].priority = temp;

      objectivesData = objectivesData.sort((item1, item2) => item1.priority - item2.priority);
      previousIndex = itemIndex;

      component.setState({objectivesData});
    }
  }
};


class Objectives extends Component {

  static propTypes = {
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool,
    item: PropTypes.object,
  };

	static contextTypes = {
		container: PropTypes.any,
    containerRect: PropTypes.object,
  };
  componentWillMount(){
    const {objectivesData} = this.props;
    this.setState({objectivesData});
  }

  componentWillReceiveProps(nextProps) {
    const {objectivesData} = nextProps;
    const objectivesDataInPreviousProps = this.props.objectivesData;
    if(objectivesDataInPreviousProps !== objectivesData)
      this.setState({objectivesData});
  }

  render() {
    const {editObjective, deleteObjective, connectDropTarget} = this.props
    const {objectivesData} = this.state;
    const objectiveViews = objectivesData
      .map((item, index) =>
        <DraggableObjectiveView key={index}
                       index={index}
                       item={item}
                       editObjective={() => editObjective(item)}
                       deleteObjective={() => {
                         deleteObjective(item.indicator, item.monthIndex);
                       }}/>);
   
    return connectDropTarget(
      <div>
        {objectiveViews}
      </div>
    );
  }
}

export default DropTarget(['objective'], specs, (connectDragSource, monitor) => ({
	connectDropTarget: connectDragSource.dropTarget(),
	isOver: monitor.isOver(),
	canDrop: monitor.canDrop(),
	item: monitor.getItem()
}))(Objectives)
