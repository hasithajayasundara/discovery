import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ReactAuthProvider } from '@cognite/react-auth';
import { Route, Redirect, Switch } from 'react-router-dom';
import Main from './Main';

const Auth = ({ tenant, match }) => (
  <ReactAuthProvider
    project={tenant}
    redirectUrl={window.location.href}
    errorRedirectUrl={window.location.href}
    usePopup
    enableTokenCaching
  >
    <Switch>
      <Redirect
        exact
        strict
        from={`${match.url}`}
        to={`${match.url}/asset/7446334693628062`}
      />
      <Route component={Main} />
    </Switch>
  </ReactAuthProvider>
);
Auth.propTypes = {
  tenant: PropTypes.string.isRequired,
  match: PropTypes.shape({
    url: PropTypes.string.isRequired,
  }).isRequired,
};

const mapStateToProps = (_, ownProps) => {
  const { tenant } = ownProps.match.params;
  return { tenant };
};

export default connect(mapStateToProps)(Auth);
