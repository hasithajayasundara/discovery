import React from 'react';
import { connect } from 'react-redux';
import { Layout, Radio, Divider, Button } from 'antd';
import { bindActionCreators, Dispatch } from 'redux';
import styled from 'styled-components';
import { Asset } from '@cognite/sdk';
import { selectAssets, AssetsState } from '../../modules/assets';
import {
  AppState,
  selectApp,
  setAssetId,
  resetAppState,
  setModelAndRevisionAndNode,
} from '../../modules/app';
import AssetSearchComponent from '../AssetSearchComponent';
import AssetPane from './AssetPane';
import ThreeDPane from './ThreeDPane';
import { RootState } from '../../reducers/index';
import { selectThreeD, ThreeDState } from '../../modules/threed';
import { trackUsage } from '../../utils/metrics';

const { Sider } = Layout;

const RootSelector = styled(Radio.Group)`
  && {
    margin-top: 12px;
    margin-bottom: 12px;
    display: flex;
  }
  && > * {
    flex: 1;
  }
`;

type Props = {
  app: AppState;
  assets: AssetsState;
  threed: ThreeDState;
  setAssetId: typeof setAssetId;
  setModelAndRevisionAndNode: typeof setModelAndRevisionAndNode;
  resetAppState: typeof resetAppState;
};

type State = {
  selectedPane: 'asset' | '3d';
};

class Sidebar extends React.Component<Props, State> {
  state: Readonly<State> = {
    selectedPane: 'asset',
  };

  componentDidMount() {
    if (!!this.props.app.assetId && !!this.props.app.modelId) {
      this.setState({ selectedPane: 'asset' });
    } else if (!this.props.app.assetId && !!this.props.app.modelId) {
      this.setState({ selectedPane: '3d' });
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (
      !prevProps.app.assetId &&
      !!this.props.app.assetId &&
      !!this.props.app.modelId
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ selectedPane: 'asset' });
    } else if (
      !!prevProps.app.assetId &&
      !this.props.app.assetId &&
      !!this.props.app.modelId
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ selectedPane: '3d' });
    }
  }

  render() {
    const {
      app: { rootAssetId, modelId },
    } = this.props;

    let onboardingText = (
      <Button
        style={{ marginBottom: '12px' }}
        onClick={() => {
          // Only reset to model id if a node is selected
          if (this.props.app.modelId && this.props.app.nodeId) {
            this.props.setModelAndRevisionAndNode(
              this.props.app.modelId,
              this.props.app.revisionId,
              undefined
            );
          } else {
            this.props.resetAppState();
          }
        }}
      >
        Clear Selection
      </Button>
    );
    // Nothing selected
    if (!modelId && !rootAssetId) {
      onboardingText = (
        <>
          <p style={{ marginBottom: '16px' }}>
            Welcome to <strong>Discovery</strong>.
          </p>
          <p>
            Start by searching using the search bar above or choosing a root
            asset or 3D model via the tabs.
          </p>
          <Divider />
        </>
      );
    }
    return (
      <Sider
        style={{
          overflow: 'auto',
          height: '100vh',
          padding: '12px',
          background: 'rgb(255,255,255)',
        }}
        width={350}
      >
        <AssetSearchComponent
          rootAsset={
            rootAssetId ? this.props.assets.all[rootAssetId] : undefined
          }
          onAssetClicked={(selectedAsset: Asset) =>
            this.props.setAssetId(selectedAsset.rootId, selectedAsset.id)
          }
        />
        <RootSelector
          onChange={el => {
            this.setState({ selectedPane: el.target.value });
            trackUsage('Sidebar.SelectPane', { selectedPane: el.target.value });
          }}
          value={this.state.selectedPane}
        >
          <Radio.Button
            value="asset"
            disabled={!this.props.app.assetId && !!this.props.app.modelId}
          >
            Asset View
          </Radio.Button>
          <Radio.Button value="3d">3D View</Radio.Button>
        </RootSelector>
        {onboardingText}
        {this.state.selectedPane === 'asset' ? <AssetPane /> : <ThreeDPane />}
      </Sider>
    );
  }
}

const mapStateToProps = (state: RootState) => {
  return {
    app: selectApp(state),
    threed: selectThreeD(state),
    assets: selectAssets(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      setAssetId,
      setModelAndRevisionAndNode,
      resetAppState,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
