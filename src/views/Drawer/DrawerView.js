import React from 'react';
import { Dimensions } from 'react-native';
import DrawerLayout from 'react-native-drawer-layout-polyfill';

import addNavigationHelpers from '../../addNavigationHelpers';
import DrawerSidebar from './DrawerSidebar';
import getChildEventSubscriber from '../../getChildEventSubscriber';

/**
 * Component that renders the drawer.
 */
export default class DrawerView extends React.PureComponent {
  state = {
    drawerWidth:
      typeof this.props.drawerWidth === 'function'
        ? this.props.drawerWidth()
        : this.props.drawerWidth,
  };

  _childEventSubscribers = {};

  componentWillMount() {
    this._updateScreenNavigation(this.props.navigation);

    Dimensions.addEventListener('change', this._updateWidth);
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this._updateWidth);
  }

  componentDidUpdate() {
    const activeKeys = this.props.navigation.state.routes.map(
      route => route.key
    );
    Object.keys(this._childEventSubscribers).forEach(key => {
      if (!activeKeys.includes(key)) {
        delete this._childEventSubscribers[key];
      }
    });
  }

  componentWillReceiveProps(nextProps: DrawerViewProps) {
    if (
      this.props.navigation.state.index !== nextProps.navigation.state.index
    ) {
      const { routes, index } = nextProps.navigation.state;
      if (routes[index].routeName === 'DrawerOpen') {
        this._drawer.openDrawer();
      } else if (routes[index].routeName === 'DrawerToggle') {
        if (this._drawer.state.drawerShown) {
          this.props.navigation.dispatch({
            type: 'NAV_TOGGLE_DRAWER'
          });
        }
      } else {
        this._drawer.closeDrawer();
      }
    }
    this._updateScreenNavigation(nextProps.navigation);
  }
 
  _screenNavigationProp: NavigationScreenProp<NavigationStateRoute>;
 
  _handleDrawerOpen = () => {
    const { navigation } = this.props;
    const { routes, index } = navigation.state;
   
    if (routes[index].routeName !== 'DrawerOpen') {
      this.props.navigation.dispatch({
        type: 'NAV_OPEN_DRAWER'
      });
    }
  };
 
  _handleDrawerClose = () => {
    const { navigation } = this.props;
    const { routes, index } = navigation.state;
    if (routes[index].routeName !== 'DrawerClose') {
      this.props.navigation.dispatch({
        type: 'NAV_CLOSE_DRAWER'
      });
    }
  };
 

  _isRouteFocused = route => () => {
    const { state } = this.props.navigation;
    const focusedRoute = state.routes[state.index];
    return route === focusedRoute;
  };

  _updateScreenNavigation = navigation => {
    const { drawerCloseRoute } = this.props;
    const navigationState = navigation.state.routes.find(
      route => route.routeName === drawerCloseRoute
    );
    if (
      this._screenNavigationProp &&
      this._screenNavigationProp.state === navigationState
    ) {
      return;
    }

    if (!this._childEventSubscribers[navigationState.key]) {
      this._childEventSubscribers[
        navigationState.key
      ] = getChildEventSubscriber(navigation.addListener, navigationState.key);
    }

    this._screenNavigationProp = addNavigationHelpers({
      dispatch: navigation.dispatch,
      state: navigationState,
      isFocused: () => this._isRouteFocused(navigationState),
      addListener: this._childEventSubscribers[navigationState.key],
    });
  };

  _updateWidth = () => {
    const drawerWidth =
      typeof this.props.drawerWidth === 'function'
        ? this.props.drawerWidth()
        : this.props.drawerWidth;

    if (this.state.drawerWidth !== drawerWidth) {
      this.setState({ drawerWidth });
    }
  };

  _getNavigationState = navigation => {
    const { drawerCloseRoute } = this.props;
    const navigationState = navigation.state.routes.find(
      route => route.routeName === drawerCloseRoute
    );
    return navigationState;
  };

  _renderNavigationView = () => {
    const { drawerOpenRoute, drawerCloseRoute, drawerToggleRoute } = this.props;

    return (
      <DrawerSidebar
        screenProps={this.props.screenProps}
        navigation={this._screenNavigationProp}
        router={this.props.router}
        contentComponent={this.props.contentComponent}
        contentOptions={this.props.contentOptions}
        drawerPosition={this.props.drawerPosition}
        style={this.props.style}
        drawerOpenRoute={drawerOpenRoute}
        drawerCloseRoute={drawerCloseRoute}
        drawerToggleRoute={drawerToggleRoute}
      />
    );
  };

  render() {
    const DrawerScreen = this.props.router.getComponentForRouteName(
      this.props.drawerCloseRoute
    );

    const config = this.props.router.getScreenOptions(
      this._screenNavigationProp,
      this.props.screenProps
    );

    return (
      <DrawerLayout
        ref={c => {
          this._drawer = c;
        }}
        drawerLockMode={
          (this.props.screenProps && this.props.screenProps.drawerLockMode) ||
          (config && config.drawerLockMode)
        }
        drawerBackgroundColor={this.props.drawerBackgroundColor}
        drawerWidth={this.state.drawerWidth}
        onDrawerOpen={this._handleDrawerOpen}
        onDrawerClose={this._handleDrawerClose}
        useNativeAnimations={this.props.useNativeAnimations}
        renderNavigationView={this._renderNavigationView}
        drawerPosition={
          this.props.drawerPosition === 'right'
            ? DrawerLayout.positions.Right
            : DrawerLayout.positions.Left
        }
      >
        <DrawerScreen
          screenProps={this.props.screenProps}
          navigation={this._screenNavigationProp}
        />
      </DrawerLayout>
    );
  }
}
