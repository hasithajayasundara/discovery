import React from 'react';
import { Modal, Button, Cascader } from 'antd';
import { TimeseriesChartMeta } from '@cognite/gearbox';
import { Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { selectTimeseries, TimeseriesState } from '../modules/timeseries';
import { RootState } from '../reducers/index';
import { selectApp, AppState, setTimeseriesId } from '../modules/app';
import { selectDatakit, DataKitState, addToDataKit } from '../modules/datakit';

type Props = {
  datakit: DataKitState;
  timeseries: TimeseriesState;
  app: AppState;
  addToDataKit: typeof addToDataKit;
  setTimeseriesId: typeof setTimeseriesId;
};

class TimeseriesPreview extends React.PureComponent<Props, {}> {
  render() {
    const {
      datakit,
      timeseries: { timeseriesData },
      app: { timeseriesId },
    } = this.props;
    let timeseries;
    if (timeseriesId) {
      timeseries = timeseriesData[timeseriesId];
    }

    const options = Object.keys(datakit).map(name => ({
      value: name,
      label: `Kit: ${name}`,
      children: [
        {
          value: 'input',
          label: 'Add As Input',
        },
        {
          value: 'output',
          label: 'Add As Output',
        },
      ],
    }));
    return (
      <Modal
        visible={timeseriesId !== undefined}
        width={1000}
        title={timeseries ? timeseries.name! : 'Loading...'}
        onCancel={() => this.props.setTimeseriesId(undefined)}
        footer={[null, null]}
      >
        <Cascader
          options={options}
          onChange={values =>
            this.props.addToDataKit(
              values[0],
              timeseriesId!,
              values[1] === 'output'
            )
          }
        >
          <Button>Add to Data Kit</Button>
        </Cascader>
        {timeseries && <TimeseriesChartMeta timeseriesId={timeseries.id} />}
      </Modal>
    );
  }
}

const mapStateToProps = (state: RootState) => {
  return {
    datakit: selectDatakit(state),
    timeseries: selectTimeseries(state),
    app: selectApp(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators({ setTimeseriesId, addToDataKit }, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TimeseriesPreview);
