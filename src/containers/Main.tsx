import React from 'react';
import { connect } from 'react-redux';
import { Layout, Switch, Radio } from 'antd';
import { bindActionCreators, Dispatch } from 'redux';
import styled from 'styled-components';
import { Asset } from '@cognite/sdk';
import {
  AssetViewer as AssetViewerComponent,
  // eslint-disable-next-line import/no-named-default
  default as AssetViewer,
} from './AssetViewer';
import { fetchTypes } from '../modules/types';
import {
  fetchModels,
  selectThreeD,
  ThreeDState,
  fetchRevisions,
} from '../modules/threed';
import { selectAssets, AssetsState } from '../modules/assets';
import { RootState } from '../reducers/index';
import ModelList from './ModelList';
import AssetSearchComponent from './AssetSearchComponent';
import AssetDrawer from './Sidebar/SidebarAssetView';
import NodeDrawer from './Sidebar/SidebarNodeView';
import {
  AppState,
  selectApp,
  setAssetId,
  resetAppState,
  setModelAndRevisionAndNode,
} from '../modules/app';

// 13FV1234 is useful asset
const { Content, Header, Sider } = Layout;

const StyledHeader = styled(Header)`
  && {
    background-color: rgba(0, 0, 0, 0);
    z-index: 100;
    padding-left: 24px;
    background: #343434;
  }
  && button {
    margin-right: 12px;
  }
`;

const RootSelector = styled(Radio.Group)`
  && {
    margin: 12px;
    margin-bottom: 0px;
    display: flex;
  }
  && > * {
    flex: 1;
  }
`;

const AssetSectionWrapper = styled.div`
  margin-top: 16px;
  margin-left: 12px;
  margin-right: 12px;

  .content-section {
    margin-top: 12px;
  }
`;

function stringToBool(str: string) {
  return str === 'true';
}

type Props = {
  match: any;
  history: any;
  location: any;
  threed: ThreeDState;
  app: AppState;
  assets: AssetsState;
  doFetchRevisions: typeof fetchRevisions;
  doFetchTypes: typeof fetchTypes;
  doFetchModels: typeof fetchModels;
  setAssetId: typeof setAssetId;
  setModelAndRevisionAndNode: typeof setModelAndRevisionAndNode;
  resetAppState: typeof resetAppState;
};

type State = {
  showRelationships: boolean;
  showAssetViewer: boolean;
  show3D: boolean;
  showPNID: boolean;
  selectedPane: string;
};

class Main extends React.Component<Props, State> {
  state = {
    show3D: localStorage.getItem('show3D')
      ? stringToBool(localStorage.getItem('show3D')!)
      : true,
    showPNID: localStorage.getItem('showPNID')
      ? stringToBool(localStorage.getItem('showPNID')!)
      : true,
    showAssetViewer: localStorage.getItem('showAssetViewer')
      ? stringToBool(localStorage.getItem('showAssetViewer')!)
      : true,
    showRelationships: localStorage.getItem('showRelationshipViewer')
      ? stringToBool(localStorage.getItem('showRelationshipViewer')!)
      : false,
    selectedPane: 'asset',
  };

  viewer = React.createRef<AssetViewerComponent>();

  isLoading = false;

  componentDidMount() {
    this.props.doFetchTypes();
    if (!this.props.threed.loading) {
      this.props.doFetchModels();
    }
    // Another workaround for a bug in SVGViewer
    if (this.state.showPNID) {
      this.setState({ showPNID: false });
      setTimeout(() => {
        this.setState({ showPNID: true });
      }, 500);
    }

    this.checkAndFixURL();
  }

  componentDidUpdate() {
    this.checkAndFixURL();
  }

  checkAndFixURL = () => {
    const {
      match: {
        params: { rootAssetId, assetId },
      },
    } = this.props;
    if (assetId || rootAssetId) {
      const asset = this.props.assets.all[Number(assetId || rootAssetId)];
      if (asset && Number(asset.rootId) !== Number(rootAssetId)) {
        this.onAssetIdChange(asset.rootId, asset.id);
      }
    }
  };

  onAssetIdChange = (rootAssetId?: number, assetId?: number) => {
    if (rootAssetId) {
      this.props.setAssetId(rootAssetId, assetId || rootAssetId);
    } else {
      this.props.resetAppState();
    }
  };

  on3DVisibleChange = (visible: boolean) => {
    this.setState({ show3D: visible });
    localStorage.setItem('show3D', `${visible}`);
  };

  onPNIDVisibleChange = (visible: boolean) => {
    this.setState({ showPNID: visible });
    localStorage.setItem('showPNID', `${visible}`);
  };

  onAssetViewerChange = (visible: boolean) => {
    const { showRelationships } = this.state;
    this.setState({
      showAssetViewer: visible,
      showRelationships: visible ? false : showRelationships,
    });
    localStorage.setItem('showAssetViewer', `${visible}`);
  };

  onRelationshipsViewerChange = (visible: boolean) => {
    const { showAssetViewer } = this.state;
    this.setState({
      showRelationships: visible,
      showAssetViewer: visible ? false : showAssetViewer,
    });
    localStorage.setItem('showRelationships', `${visible}`);
  };

  hasModelForAsset = (assetId: number) => {
    return this.props.threed.representsAsset[assetId];
  };

  renderSidebar = () => {
    const {
      app: { assetId, rootAssetId },
      assets,
    } = this.props;
    const asset = assets.all[Number(assetId)];
    return (
      <Sider
        style={{
          overflow: 'auto',
          height: '100vh',
          background: 'rgb(255,255,255)',
        }}
        width={350}
      >
        <RootSelector
          onChange={el => this.setState({ selectedPane: el.target.value })}
          value={this.state.selectedPane}
        >
          <Radio.Button value="asset">Assets</Radio.Button>
          <Radio.Button value="3d">3D Models</Radio.Button>
        </RootSelector>
        {this.state.selectedPane === 'asset' ? (
          <>
            <AssetSectionWrapper>
              <AssetSearchComponent
                rootAsset={
                  rootAssetId ? this.props.assets.all[rootAssetId] : undefined
                }
                onAssetClicked={(selectedAsset: Asset) =>
                  this.onAssetIdChange(selectedAsset.rootId, selectedAsset.id)
                }
              />
              <div className="content-section">
                {asset && <AssetDrawer />}
                {!asset && <NodeDrawer />}
              </div>
            </AssetSectionWrapper>
          </>
        ) : (
          <ModelList />
        )}
      </Sider>
    );
  };

  render() {
    let model3D: { modelId: number; revisionId: number } | undefined;
    const {
      app: { modelId, revisionId },
    } = this.props;

    if (this.viewer && this.viewer.current) {
      if (modelId && revisionId) {
        model3D = {
          modelId,
          revisionId,
        };
      }
    }
    return (
      <div className="main-layout" style={{ width: '100%', height: '100vh' }}>
        <Layout>
          <Layout>
            {this.renderSidebar()}
            <Content
              style={{
                display: 'flex',
                height: '100vh',
                flexDirection: 'column',
              }}
            >
              <StyledHeader>
                <Switch
                  checked={model3D && this.state.show3D}
                  checkedChildren="3D"
                  unCheckedChildren="3D"
                  onChange={this.on3DVisibleChange}
                  disabled={!model3D}
                />
                <Switch
                  checked={this.state.showPNID}
                  checkedChildren="P&ID"
                  unCheckedChildren="P&ID"
                  onChange={this.onPNIDVisibleChange}
                />
                <Switch
                  checked={
                    !this.state.showRelationships && this.state.showAssetViewer
                  }
                  checkedChildren="Asset Network Viewer"
                  unCheckedChildren="Asset Network Viewer"
                  onChange={this.onAssetViewerChange}
                />
                <Switch
                  checked={this.state.showRelationships}
                  checkedChildren="Relationships Viewer"
                  unCheckedChildren="Relationships Viewer"
                  onChange={this.onRelationshipsViewerChange}
                />
              </StyledHeader>
              <AssetViewer
                show3D={model3D !== undefined && this.state.show3D}
                showAssetViewer={this.state.showAssetViewer}
                showRelationships={this.state.showRelationships}
                showPNID={this.state.showPNID}
                ref={this.viewer}
              />
            </Content>
          </Layout>
        </Layout>
      </div>
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
      doFetchTypes: fetchTypes,
      doFetchRevisions: fetchRevisions,
      doFetchModels: fetchModels,
      setAssetId,
      setModelAndRevisionAndNode,
      resetAppState,
    },
    dispatch
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main);