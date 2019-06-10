import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Layout, Switch } from 'antd';
import { Route } from 'react-router-dom';
import AssetSearch from '../components/AssetSearch';
import AssetViewer from './AssetViewer';
import { fetchTypes } from '../modules/types';

// 13FV1234 is useful asset
const { Content, Header, Sider } = Layout;

function stringToBool(string) {
  return string === 'true';
}

class Main extends React.Component {
  state = {
    show3D:
      localStorage.getItem('show3D') != null
        ? stringToBool(localStorage.getItem('show3D'))
        : true,
    showPNID:
      localStorage.getItem('showPNID') != null
        ? stringToBool(localStorage.getItem('showPNID'))
        : true,
  };

  componentDidMount() {
    this.props.doFetchTypes();
    // Another workaround for a bug in SVGViewer
    if (this.state.showPNID) {
      this.setState({ showPNID: false });
      setTimeout(() => {
        this.setState({ showPNID: true });
      }, 500);
    }
  }

  onAssetClick = (asset, query) => {
    const { match, history } = this.props;
    history.push({
      pathname: `${match.url}/asset/${asset.id}`,
      search: `?query=${query}`,
    });
  };

  onAssetIdChange = assetId => {
    const { match, history } = this.props;
    history.push({
      pathname: `${match.url}/asset/${assetId}`,
    });
  };

  on3DVisibleChange = value => {
    this.setState({ show3D: value });
    localStorage.setItem('show3D', value);
  };

  onPNIDVisibleChange = value => {
    this.setState({ showPNID: value });
    localStorage.setItem('showPNID', value);
  };

  render() {
    const { match, history, location } = this.props;
    const assetDrawerWidth = 275;
    return (
      <div className="main-layout" style={{ width: '100%', height: '100vh' }}>
        <Layout>
          <Layout>
            <Sider
              style={{
                overflow: 'auto',
                height: '100vh',
                background: 'rgb(38, 38, 38)',
              }}
              width={250}
            >
              <Route
                path={`${match.url}/asset/:assetId`}
                render={props => {
                  const { assetId } = props.match.params;
                  return (
                    <AssetSearch
                      history={history}
                      location={location}
                      onAssetClick={this.onAssetClick}
                      assetId={Number(assetId)}
                    />
                  );
                }}
              />
            </Sider>
            <Content>
              <Header
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.0)',
                  float: 'right',
                  position: 'fixed',
                  right: '0',
                  top: '0',
                }}
              >
                <div style={{ paddingRight: assetDrawerWidth - 30 }}>
                  <Switch
                    checked={this.state.show3D}
                    checkedChildren="3D"
                    unCheckedChildren="3D"
                    onChange={this.on3DVisibleChange}
                  />
                  <Switch
                    checked={this.state.showPNID}
                    checkedChildren="P&ID"
                    unCheckedChildren="P&ID"
                    onChange={this.onPNIDVisibleChange}
                  />
                </div>
              </Header>
              <Route
                path={`${match.url}/asset/:assetId`}
                render={props => {
                  const { assetId } = props.match.params;
                  return (
                    <AssetViewer
                      assetId={Number(assetId)}
                      show3D={this.state.show3D}
                      showPNID={this.state.showPNID}
                      onAssetIdChange={this.onAssetIdChange}
                      assetDrawerWidth={assetDrawerWidth}
                    />
                  );
                }}
              />
            </Content>
          </Layout>
        </Layout>
      </div>
    );
  }
}

Main.propTypes = {
  match: PropTypes.shape({
    url: PropTypes.string.isRequired,
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
    search: PropTypes.string,
  }).isRequired,
  doFetchTypes: PropTypes.func.isRequired,
};

const mapStateToProps = () => {
  return {};
};

const mapDispatchToProps = dispatch => ({
  doFetchTypes: (...args) => dispatch(fetchTypes(...args)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main);
