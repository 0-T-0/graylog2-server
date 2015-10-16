import React from 'react';
import Reflux from 'reflux';
import { Row, Input, Button, ButtonInput, Alert } from 'react-bootstrap';
import SessionActions from 'actions/sessions/SessionActions';
import SessionStore from 'stores/sessions/SessionStore';

const LoginPage = React.createClass({
  mixins: [Reflux.connect(SessionStore), Reflux.ListenerMethods],
  disconnectedStyle: require('!style/useable!css!less!stylesheets/disconnected.less'),
  authStyle: require('!style/useable!css!less!stylesheets/auth.less'),

  componentDidMount() {
    this.disconnectedStyle.use();
    this.authStyle.use();
  },
  componentWillUnmount() {
    this.disconnectedStyle.unuse();
    this.authStyle.unuse();
  },
  onSignInClicked() {
    this.resetLastError();
    const username = this.refs.username.getValue();
    const password = this.refs.password.getValue();
    const location = document.location.host;
    SessionActions.login.triggerPromise(username, password, location).catch((error) => {
      if (error.additional.status === 401) {
        this.setState({lastError: 'The server rejected your credentials. Please verity them and retry.'});
      } else {
        this.setState({lastError: 'Error - the server returned: ' + error.additional.status + ' - ' + error.additional.message});
      }
    });
  },
  render() {
    const alert = this.formatLastError(this.state.lastError);
    return (
      <div>
        <div className="container" id="login-box">
          <Row>
            <div className="col-md-4 col-md-offset-4 well" id="login-box-content">
              <legend><i className="fa fa-group"/> Welcome to Graylog</legend>

              {alert}

              <div className="form-group">
                <Input ref="username" type="text" placeholder="Username" autoFocus />
              </div>

              <div className="form-group">
                <Input ref="password" type="password" placeholder="Password" />
              </div>

              <ButtonInput type="submit" bsStyle="info" onClick={this.onSignInClicked}>Sign in</ButtonInput>

              <div className="login-advanced">
                <div className="footer pull-right">
                  <span id="total-count-zero" className="hidden">No configured node was ever reached.</span>
                  <span id="total-count-nonzero"><span id="connected-count"/> of <span id="total-count"/> nodes connected.</span>
                </div>
                <br style={{clear: 'both'}} />
              </div>
            </div>
          </Row>
        </div>
      </div>
    );
  },
  formatLastError(error) {
    if (error) {
      return (
        <div className="form-group">
          <Alert bsStyle="danger">
            <a className="close" onClick={this.resetLastError}>×</a>{error}
          </Alert>
        </div>
      );
    }
    return null;
  },
  resetLastError() {
    this.setState({lastError: undefined});
  },
});

export default LoginPage;

