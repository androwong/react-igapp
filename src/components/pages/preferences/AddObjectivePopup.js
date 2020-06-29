import React from 'react';
import Component from 'components/Component';
import Select from 'components/controls/Select';
import Button from 'components/controls/Button';
import Page from 'components/Page';
import Label from 'components/ControlsLabel';
import Textfield from 'components/controls/Textfield';
import style from 'styles/onboarding/onboarding.css';
import popupStyle from 'styles/welcome/add-member-popup.css';
import {getIndicatorsWithProps, getNickname, getMetadata} from 'components/utils/indicators';
import Calendar from 'components/controls/Calendar';
import Toggle from 'components/controls/Toggle';
import NotSure from 'components/onboarding/NotSure';
import ButtonsSet from 'components/pages/profile/ButtonsSet';
import navStyle from 'styles/profile/market-fit-popup.css';
import {timeFrameToDate} from 'components/utils/objective';
import {isPopupMode} from 'modules/popup-mode';
import {formatNumber} from 'components/utils/budget';
import {extractNumber} from 'components/utils/utils';
import isNil from 'lodash/isNil';

export default class AddObjectivePopup extends Component {

  style = style;
  styles = [popupStyle, navStyle];

  defaultData = {
    indicator: '',
    isRecurrent: false,
    recurrentType: 'monthly',
    isPercentage: false,
    isTarget: true,
    amount: '',
    recurrentArray: new Array(12).fill(-1),
    monthIndex: null
  };

  constructor(props) {
    super(props);
    this.state = {
      ...this.defaultData,
      notSure: 0,
      priority: 0
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.hidden !== this.props.hidden) {
      if (!isNil(nextProps.objectiveMonth) && nextProps.objective) {
        const objective = this.props.objectives[nextProps.objectiveMonth][nextProps.objective];
        if (objective) {
          this.setState({
            indicator: nextProps.objective,
            isRecurrent: objective.userInput.isRecurrent,
            recurrentType: objective.userInput.recurrentType,
            isPercentage: objective.userInput.isPercentage,
            isTarget: objective.userInput.isTarget,
            priority: objective.target.priority,
            amount: objective.userInput.amount,
            recurrentArray: objective.userInput.recurrentArray,
            monthIndex: nextProps.objectiveMonth
          }, this.calculateTargetValue);
        }
      }
      else {
        this.setState({
          ...this.defaultData,
          priority: nextProps.numOfObjectives,
          notSure: 0
        });
      }
    }
  }

  calculateObjective() {
    const d1 = new Date();
    const d2 = timeFrameToDate(this.state.timeFrame);
    let months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    if (months <= 0) {
      months = 0;
    }
    if (months > 11) {
      months = 11;
    }
    const value = Math.round((this.props.forecastedIndicators[months][this.state.indicator].committed -
      this.props.actualIndicators[this.state.indicator]) *
      this.state.aggressiveLevel +
      this.props.actualIndicators[this.state.indicator]);
    this.setState({
      amount: value,
      targetValue: value,
      isPercentage: false,
      direction: 'equals',
      monthIndex: months,
      notSure: 3
    });
  }

  calculateTargetValue() {
    const isDirectionUp = this.state.indicator && getMetadata('isDirectionUp', this.state.indicator);
    let targetValue;
    if (this.state.isTarget) {
      targetValue = this.state.amount;
    }
    else if (this.state.isPercentage) {
      targetValue =
        (1 + (this.state.amount / 100 * (isDirectionUp ? 1 : -1))) * this.props.actualIndicators[this.state.indicator];
    }
    else {
      const indicator = this.props.actualIndicators[this.state.indicator] || 0;
      targetValue = indicator + (this.state.amount * (isDirectionUp ? 1 : -1));
    }

    if (targetValue) {
      this.setState({targetValue: Math.round(targetValue)});
    }
  }

  getMonthsObjectives = () => {
    return this.props.dates.map((month, index) =>
      <div className={this.classes.cell} key={index}>
        <Label style={{width: '70px', marginTop: '12px'}}>{month}</Label>
        <Textfield
          value={this.state.recurrentArray[index] > 0 ? formatNumber(this.state.recurrentArray[index]) : ''}
          onChange={(e) => {
            const value = extractNumber(e.target.value, -1);
            this.handleCustomChange(value, index);
          }}
          style={{width: '166px'}}/>
      </div>
    );
  };

  handleCustomChange = (value, index) => {
    const recurrentArray = [...this.state.recurrentArray];
    recurrentArray[index] = value;
    this.setState({recurrentArray: recurrentArray}, this.calculateTargetValue);
  };

  render() {
    const indicatorsWithProps = getIndicatorsWithProps();
    const directionText = (this.state.indicator && indicatorsWithProps[this.state.indicator].isDirectionUp)
      ? 'Increase'
      : 'Decrease';
    const objectivesPriority = [];
    for (let i = 0; i <= this.props.numOfObjectives; i++) {
      objectivesPriority.push({value: i, label: '#' + (i + 1)});
    }
    const isFirstObjective = this.props.numOfObjectives === 0;

    const datesOptions = this.props.dates.map((item, index) => {
      return {label: item, value: index};
    });

    const typeOptions = [{label: '(num)', value: false}];
    // If current indicator is 0 or not defined, prevent increase in percentages
    if (this.props.actualIndicators[this.state.indicator]) {
      typeOptions.push({label: '%', value: true});
    }

    const amountTextField = <Textfield type="number" value={this.state.amount} onChange={(e) => {
      this.setState({amount: parseInt(e.target.value)}, this.calculateTargetValue);
    }} style={{width: '102px'}}/>;

    return <div hidden={this.props.hidden}>
      {this.state.notSure ?
        <Page popup={true} width={'800px'} contentClassName={popupStyle.locals.content}
              innerClassName={popupStyle.locals.inner}>
          <div className={popupStyle.locals.title}>
            Objective Assistant
          </div>
          <div>
            {
              this.state.notSure === 1 ?
                <div>
                  <div className={this.classes.row}>
                    <Label style={{justifyContent: 'center', textTransform: 'capitalize', fontSize: '15px'}}>
                      Add a Due date
                    </Label>
                    <div style={{width: '200px', margin: 'auto', paddingLeft: '35px'}}>
                      <Calendar value={this.state.timeFrame} onChange={(e) => {
                        this.setState({timeFrame: e});
                      }}/>
                    </div>
                  </div>
                  <div className={navStyle.locals.nav}>
                    <Button type="secondary" style={{
                      width: '100px',
                      marginRight: '20px'
                    }} onClick={() => {
                      this.setState({notSure: 0});
                    }}>
                      <div className={navStyle.locals.backIcon}/>
                      BACK
                    </Button>
                    <Button type="primary" style={{
                      width: '100px'
                    }} onClick={() => {
                      this.setState({notSure: 2});
                    }}>
                      NEXT
                      <div className={navStyle.locals.nextIcon}/>
                    </Button>
                  </div>
                </div>
                : this.state.notSure === 2 ?
                <div>
                  <div className={this.classes.row}>
                    <Label style={{justifyContent: 'center', textTransform: 'capitalize', fontSize: '15px'}}>How
                      aggressive you’re willing to be with the objective?</Label>
                    <div style={{justifyContent: 'center', display: 'flex'}}>
                      <ButtonsSet buttons={[
                        {key: 0.5, text: 'Light', icon: 'buttons:light'},
                        {key: 0.75, text: 'Caution', icon: 'buttons:caution'},
                        {key: 1, text: 'Moderate', icon: 'buttons:moderate'},
                        {key: 1.25, text: 'Aggressive', icon: 'buttons:aggressive'},
                        {key: 1.5, text: 'Optimistic', icon: 'buttons:optimistic'}
                      ]} selectedKey={this.state.aggressiveLevel}
                                  onChange={(e) => {
                                    this.setState({aggressiveLevel: e});
                                  }}/>
                    </div>
                  </div>
                  <div className={navStyle.locals.nav}>
                    <Button type="secondary" style={{
                      width: '100px',
                      marginRight: '20px'
                    }} onClick={() => {
                      this.setState({notSure: 1});
                    }}>
                      <div className={navStyle.locals.backIcon}/>
                      BACK
                    </Button>
                    <Button type="primary" style={{
                      width: '100px'
                    }} onClick={this.calculateObjective.bind(this)}>
                      NEXT
                      <div className={navStyle.locals.nextIcon}/>
                    </Button>
                  </div>
                </div>
                : this.state.notSure === 3 ?
                  <div>
                    <div className={this.classes.row}>
                      <Label style={{
                        justifyContent: 'center',
                        textTransform: 'none',
                        fontSize: '15px',
                        fontWeight: '500',
                        whiteSpace: 'pre'
                      }}>
                        {'I want to reach a target of '} <span
                        style={{fontWeight: '700'}}>{formatNumber(this.state.amount)}</span>{` ${getNickname(this.state.indicator)} by ${this.state.timeFrame}`}
                      </Label>
                    </div>
                    <div className={navStyle.locals.nav}>
                      <Button type="secondary" style={{
                        width: '100px',
                        marginRight: '20px'
                      }} onClick={() => {
                        this.setState({
                          amount: '',
                          isPercentage: '',
                          direction: '',
                          notSure: 0,
                          aggressiveLevel: ''
                        });
                      }}>
                        <div className={navStyle.locals.backIcon}/>
                        Don't use
                      </Button>
                      <Button type="primary" style={{
                        width: '100px'
                      }} onClick={() => {
                        this.setState({notSure: 0, aggressiveLevel: ''}, () => {
                          this.props.createOrUpdateObjective(this.state,
                            this.props.objectiveMonth,
                            this.props.objective);
                        });
                      }}>
                        Use
                        <div className={navStyle.locals.nextIcon}/>
                      </Button>
                    </div>
                  </div>
                  : null
            }
          </div>
        </Page>
        :
        <Page popup={true} width={'410px'} contentClassName={popupStyle.locals.content}
              innerClassName={popupStyle.locals.inner}>
          <div className={popupStyle.locals.title}>
            {isFirstObjective ?
              <div>Add Your Main Objective
                <div className={popupStyle.locals.subTitle}>what's your end-goal for the marketing org?</div>
              </div> : 'Add Objective'}
          </div>
          <div className={this.classes.row}>
            <Label>
              Choose metric as objective
            </Label>
            <div style={{display: 'flex'}}>
              <Select
                selected={this.state.indicator}
                select={{
                  placeholder: 'KPI',
                  options: this.props.objectivesOptions
                }}
                onChange={(e) => {
                  this.setState({indicator: e.value}, this.calculateTargetValue);
                }}
                style={{width: '200px'}}
                ref="indicator"
              />
              {(this.state.indicator && this.props.actualIndicators[this.state.indicator]) ?
                <div className={this.classes.text} style={{marginLeft: '20px'}}>
                  current: {formatNumber(this.props.actualIndicators[this.state.indicator])}
                </div>
                : null}
            </div>
          </div>
          <div className={this.classes.row}>
            <Label>
              Priority
            </Label>
            <Select
              selected={this.state.priority}
              select={{
                options: objectivesPriority
              }}
              onChange={(e) => {
                this.setState({priority: parseInt(e.value)});
              }}
              style={{width: '75px'}}
            />
          </div>
          <div className={this.classes.row} style={{display: 'flex'}}>
            <Toggle
              options={[{
                text: 'One Time',
                value: false
              },
                {
                  text: 'Recurrent',
                  value: true
                }
              ]}
              selectedValue={this.state.isRecurrent}
              onClick={(value) => {
                this.setState({isRecurrent: value, isTarget: !value}, this.calculateTargetValue);
              }}/>
          </div>
          {this.state.isRecurrent ? null :
            <div className={this.classes.row} style={{display: 'flex'}}>
              <Toggle
                options={[{
                  text: 'Target',
                  value: true
                },
                  {
                    text: directionText,
                    value: false
                  }
                ]}
                selectedValue={this.state.isTarget}
                onClick={(value) => {
                  this.setState({isTarget: value}, this.calculateTargetValue);
                }}/>
            </div>
          }
          {this.state.isRecurrent ?
            <div className={this.classes.row} style={{display: 'flex'}}>
              <Toggle
                options={[{
                  text: 'Monthly',
                  value: 'monthly'
                },
                  {
                    text: 'Quarterly',
                    value: 'quarterly'
                  },
                  {
                    text: 'Custom',
                    value: 'custom'
                  }
                ]}
                selectedValue={this.state.recurrentType}
                onClick={(value) => {
                  this.setState({recurrentType: value});
                }}/>
            </div>
            : null}
          <div className={this.classes.row}>
            <Label>
              Numeric objective{this.state.recurrentType === 'custom' ? 's' : ''}
              <div hidden={(this.state.isRecurrent || isPopupMode())}>
                <NotSure style={{
                  marginLeft: '88px'
                }} onClick={() => {
                  if (this.state.indicator) {
                    this.setState({notSure: 1});
                  }
                  else {
                    this.refs.indicator.focus();
                  }
                }}/>
              </div>
            </Label>
            {
              this.state.isTarget ?
                <div>
                  {amountTextField}
                </div>
                :
                this.state.recurrentType !== 'custom' || !this.state.isRecurrent
                  ?
                  <div style={{display: 'inline-flex'}}>
                    <div className={this.classes.text} style={{marginRight: '10px'}}>
                      {`${directionText} By`}
                    </div>
                    {amountTextField}
                    <Select
                      selected={this.state.isPercentage}
                      select={{
                        options: typeOptions
                      }}
                      onChange={(e) => {
                        this.setState({isPercentage: e.value}, this.calculateTargetValue);
                      }}
                      placeholder='%/num'
                      style={{marginLeft: '20px', width: '88px'}}
                    />
                  </div>
                  :
                  <div>
                    {this.getMonthsObjectives()}
                  </div>
            }
            {(this.state.targetValue && !this.state.isTarget) ?
              <div className={this.classes.text} style={{marginTop: '7px'}}>
                Expected target: {formatNumber(this.state.targetValue)}
              </div>
              : null}
          </div>
          {!this.state.isRecurrent ?
            <div className={this.classes.row}>
              <Label>
                Due date
              </Label>
              <Select
                selected={this.state.monthIndex}
                select={{
                  options: datesOptions
                }}
                onChange={(e) => {
                  this.setState({monthIndex: e.value});
                }}
                style={{width: '100px'}}
              />
            </div>
            :
            null}
          <div className={this.classes.footerCols}>
            <div className={this.classes.footerLeft}>
              <Button
                type="secondary"
                style={{width: '72px'}}
                onClick={this.props.close}>Cancel
              </Button>
              <Button
                type="primary"
                style={{width: '110px', marginLeft: '20px'}}
                onClick={() => {
                  this.props.createOrUpdateObjective(this.state, this.props.objectiveMonth, this.props.objective);
                }}>
                {this.props.objectiveEdit ? 'Edit Objective' : 'Add Objective'}
              </Button>
            </div>
          </div>
        </Page>
      }
    </div>;
  }
};