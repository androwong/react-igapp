import React from 'react';
import PropTypes from 'prop-types';
import { DragSource } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import Component from 'components/Component';

import ObjectiveView from 'components/pages/preferences/ObjectiveView';

function getStyles(isDragging) {
  return {
    opacity: isDragging ? 0 : 1
  };
}

const objectiveSource = {
  beginDrag(props, monitor, component) {
    const {item} = props;
    return item;
  },
  
  isDragging(props, monitor){
    return props.item.indicator && props.item.indicator === monitor.getItem().indicator;
  }
};

function collectDragSource(connectDragSource, monitor) {
  return {
    connectDragSource: connectDragSource.dragSource(),
    connectDragPreview: connectDragSource.dragPreview(),
    isDragging: monitor.isDragging(),
  };
}
class DraggableObjectiveView extends Component{
    static propTypes = {
      item: PropTypes.object,
      connectDragSource: PropTypes.func.isRequired,
      connectDragPreview: PropTypes.func.isRequired,
      isDragging: PropTypes.bool.isRequired,
			first: PropTypes.bool,
      last: PropTypes.bool,
    }

    componentDidMount() {
			this.props.connectDragPreview(getEmptyImage(), {
				captureDraggingState: true
			}); 
		}

    render() {
      const {isDragging, connectDragSource, connectDragPreview, item, ...otherProps} = this.props;
			return connectDragSource(
        <div style={getStyles(isDragging)}>
          <ObjectiveView {...item} {...otherProps} />
        </div>
			);
		}
}
export default DragSource('objective', objectiveSource, collectDragSource)(DraggableObjectiveView);