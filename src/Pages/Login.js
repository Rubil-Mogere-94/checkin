import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
// import Typography from '@mui/material/Typography';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import EngineeringIcon from '@mui/icons-material/Engineering';
import { Tabs, Tab } from '@mui/material';
import { Context } from '../Pages/Context';
import { useNavigate } from 'react-router-dom';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const drawerWidth = 240;

function Login(props) {
  const ctx = useContext(Context);
  const navigate = useNavigate();
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleGo = (event) => {
    event.preventDefault();

    ctx.currentUser = 1;
    console.log(ctx.currentUser);
    navigate('/Pages/LoginAdmin');
  };

  const handleGoEmployee = (event) => {
    event.preventDefault();

    ctx.currentUser = 1;
    console.log(ctx.currentUser);
    navigate('/Pages/LoginEmployee');
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <ListItemButton color="primary" component={Link} onClick={handleGo}>
        <ListItemIcon>
          <IconButton color="primary" component={Link} onClick={handleGo}>
            <EngineeringIcon />
          </IconButton>
          Administrator
          <Divider />
        </ListItemIcon>
      </ListItemButton>
      <Divider />
      <ListItemButton
        color="primary"
        component={Link}
        onClick={handleGoEmployee}
      >
        <ListItemIcon>
          <Divider />
          <IconButton
            color="primary"
            component={Link}
            onClick={handleGoEmployee}
          >
            <SupervisorAccountIcon />
          </IconButton>
          Employee
        </ListItemIcon>
      </ListItemButton>

      <Divider />
    </div>
  );

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          {ctx.currentUser === 1 && (
            <Tabs
              sx={{ marginLeft: 'auto' }}
              textColor="inherit"
              // onChange={handleTabChange}
              indicatorColor="secondary"
              // value={value}
            >
              <Tab
                label="User Login" 
                component={Link}
                to={'/'}
                // value={value}
              />
              {/* <Typography variant="h6" noWrap component="div">
             User Login
            </Typography> */}
            </Tabs>
          )}
          {ctx.currentUser === 2 && (
            <Tabs
              sx={{ marginLeft: 'auto' }}
              textColor="inherit"
              // onChange={handleTabChange}
              indicatorColor="secondary"
              // value={value}
            >
              <EngineeringIcon />
              <Tab
                label="Admin Profile"
                component={Link}

                // value={value}
              />
            </Tabs>
          )}
          {ctx.currentUser === 3 && (
            <Tabs
              sx={{ marginLeft: 'auto' }}
              textColor="inherit"
              // onChange={handleTabChange}
              indicatorColor="secondary"
              // value={value}
            >
              <SupervisorAccountIcon />
              <Tab
                label="Employee Profile"
                component={Link}

                // value={value}
              />
            </Tabs>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
      </Box>
      {/* <Admin /> */}
    </Box>
  );
}

Login.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window: PropTypes.func,
};

export default Login;
