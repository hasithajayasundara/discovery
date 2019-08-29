import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import debounce from 'lodash/debounce';
import { Select, Input, Divider, Card, Button, message, Spin } from 'antd';
import { Asset } from '@cognite/sdk';
import {
  selectThreeD,
  ThreeDState,
  setRevisionRepresentAsset,
} from '../modules/threed';
import { selectAssets, AssetsState, createNewAsset } from '../modules/assets';
import { RootState } from '../reducers/index';
import { sdk } from '../index';
import { createAssetNodeMapping } from '../modules/assetmappings';

const { Option } = Select;

type OrigProps = {
  modelId: number;
  revisionId: number;
  nodeId: number;
  rootAssetId: number;
  onAssetIdChange: (assetId?: number) => void;
};

type Props = {
  assets: AssetsState;
  threed: ThreeDState;
  createNewAsset: typeof createNewAsset;
  createAssetNodeMapping: typeof createAssetNodeMapping;
} & OrigProps;

type State = {
  parentAssetId?: number;
  assetId?: number;
  assetName?: string;
  searchResults: Asset[];
  fetching: boolean;
};

class MapNodeToAssetForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.doSearch = debounce(this.doSearch, 100);

    this.state = {
      searchResults: Object.values(props.assets.all).filter(
        el => el.rootId === props.rootAssetId
      ),
      fetching: false,
    };
  }

  get rootAssets() {
    return Object.values(this.props.assets.all).filter(
      el => el.rootId === el.id
    );
  }

  doSearch = async (query: string) => {
    if (query.length > 0) {
      this.setState({ fetching: true });
      const results = await sdk.assets.search({
        search: { name: query },
        filter: {
          rootIds: [{ id: this.props.rootAssetId }],
        },
        limit: 1000,
      });
      this.setState({
        searchResults: results.slice(0, results.length),
        fetching: false,
      });
    }
  };

  addMapping = () => {
    const { assetId, assetName, parentAssetId } = this.state;
    const { modelId, revisionId, nodeId } = this.props;
    if (assetName && assetName.length > 0 && parentAssetId) {
      this.props.createNewAsset(
        { name: assetName, parentId: parentAssetId },
        {
          modelId,
          revisionId,
          nodeId,
        },
        asset => {
          this.props.onAssetIdChange(asset.id);
        }
      );
    } else if (assetId) {
      this.props.createAssetNodeMapping(modelId, revisionId, nodeId, assetId);
      this.props.onAssetIdChange(assetId);
    } else {
      message.error('You need to select or provide name for a new asset.');
    }
  };

  render() {
    const {
      assetId,
      assetName,
      fetching,
      searchResults,
      parentAssetId,
    } = this.state;
    return (
      <Card>
        <h3>Map Node to an Asset</h3>
        <p>Map to an existing Asset</p>
        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="Select existing asset"
          value={assetId}
          notFoundContent={fetching ? <Spin size="small" /> : null}
          onChange={(id: any) => this.setState({ assetId: Number(id) })}
          onSearch={this.doSearch}
          filterOption={false}
        >
          {searchResults.map(asset => {
            return (
              <Option key={asset.id} value={asset.id}>
                {asset.name}
              </Option>
            );
          })}
        </Select>
        <Divider>OR</Divider>
        <p>
          Add and map to a <strong>new</strong> Asset
        </p>
        <span>Parent Node</span>
        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="Select existing asset as Parent"
          value={parentAssetId}
          notFoundContent={fetching ? <Spin size="small" /> : null}
          onChange={(id: any) => this.setState({ parentAssetId: Number(id) })}
          onSearch={this.doSearch}
          filterOption={false}
        >
          {searchResults.map(asset => (
            <Select.Option key={asset.id} value={asset.id}>
              {asset.name}
            </Select.Option>
          ))}
        </Select>
        <span>Name</span>
        <Input
          placeholder="New Asset Name"
          value={assetName}
          onChange={e => this.setState({ assetName: e.target.value })}
        />
        <Button onClick={this.addMapping} style={{ marginTop: '12px' }}>
          Confirm Mapping
        </Button>
      </Card>
    );
  }
}

const mapStateToProps = (state: RootState) => {
  return {
    threed: selectThreeD(state),
    assets: selectAssets(state),
  };
};
const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      createNewAsset,
      setRevisionRepresentAsset,
      createAssetNodeMapping,
    },
    dispatch
  );
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MapNodeToAssetForm);
