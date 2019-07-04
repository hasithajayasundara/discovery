import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Drawer, Card } from 'antd';
import Chart from 'react-apexcharts';
import { SVGViewer } from '@cognite/gearbox';
import styled from 'styled-components';
import { selectResult, selectIsLoading } from '../modules/search';
import Loader from '../components/Loader';

const getTextFromMetadataNode = node =>
  (node.textContent || '').replace(/\s/g, '');

const StyledSVGViewerContainer = styled.div`
  height: 100%;
  width: 100%;
  .myCoolThing {
    outline: auto 2px #3838ff;
    transition: all 0.2s ease;
    > {
      text {
        stroke: #3838ff;
        fill: #3838ff;
        transition: all 0.2s ease;
        text-decoration: none;
      }
      path {
        stroke: #3838ff;
        transition: all 0.2s ease;
      }
    }
    &:hover,
    &:focus {
      outline: auto 2px #36a2c2;
    }
  }
`;

class DataDrawer extends React.Component {
  state = {};

  componentDidMount() {}

  componentDidUpdate(prevProps) {}

  renderPieCharts = () => {
    const pieCharts = this.props.result.filter(
      result => result.kind === 'pie-chart'
    );

    return pieCharts.map(chart => {
      const labels = chart.data.map(item => item.title);
      const series = chart.data.map(item => item.value);
      const { title } = chart;
      const options = {
        labels,
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                width: 200,
              },
              legend: {
                position: 'bottom',
              },
            },
          },
        ],
      };

      return (
        <Card key={title} title={title}>
          <Chart
            options={options}
            series={series}
            type="pie"
            width={450}
            height={450}
          />
        </Card>
      );
    });
  };

  renderPNID() {
    const PnIDs = this.props.result.filter(result => result.kind === 'PnID');
    if (PnIDs.length === 0) {
      return null;
    }
    const currentPnID = PnIDs[0];

    return (
      <StyledSVGViewerContainer style={{ height: this.props.width }}>
        <SVGViewer
          documentId={currentPnID.fileId}
          title={currentPnID.name}
          description="P&ID"
          isCurrentAsset={metadata => {
            return getTextFromMetadataNode(metadata) === currentPnID.assetName;
          }}
        />
      </StyledSVGViewerContainer>
    );
  }

  render() {
    return (
      <Drawer
        title="Search results"
        placement="right"
        width={this.props.width}
        closable={false}
        visible
        mask={false}
      >
        {this.props.loading && <Loader />}
        {this.renderPieCharts()}
        {this.renderPNID()}
        {!this.props.loading && this.props.result.length === 0 && 'No results'}
      </Drawer>
    );
  }
}
DataDrawer.propTypes = {
  width: PropTypes.number.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  result: PropTypes.any.isRequired,
  loading: PropTypes.bool.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  return { result: selectResult(state), loading: selectIsLoading(state) };
};
const mapDispatchToProps = dispatch => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DataDrawer);
