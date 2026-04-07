import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { Context } from '../Pages/Context';
import { QRCodeSVG } from 'qrcode.react';

export default function EmployeeAccount() {
  const [location, setLocation] = useState('');
  const ctx = useContext(Context);
  let navigate = useNavigate();
  useEffect(() => {
    ctx.updateUser(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  }, []);

  const successCallback = (position) => {
    setLocation(
      `Latitud ${position.coords.latitude} Longitud ${position.coords.longitude}`
    );
    console.log(position);
  };
  const errorCallback = (error) => {
    console.log(error);
  };

  const handleLogout = () => {
    ctx.updateUser(1);
    navigate('/');
  };

  return (
    <>
      <Box
        sx={{
          marginTop: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Stack sx={{ width: '60%' }} spacing={2}>
          <Typography variant="h6" color="initial">
            {location}
          </Typography>
          <Alert severity="success">
          Your QR code has been successfully generated!
          </Alert>
          <QRCodeSVG
            renderAs="svg"
            value={`http://localhost:3000/Pages/AdminAccount/${ctx.loggedEmployeeEmail}`}
            size={300}
            bgColor={'#ffffff'}
            fgColor={'#000000'}
            level={'L'}
            includeMargin={false}
            imageSettings={{
              src: 'https://static.zpao.com/favicon.png',
              x: undefined,
              y: undefined,
              height: 24,
              width: 24,
              excavate: true,
            }}
          />
        </Stack>
        <Stack direction="row" spacing={3}>
          <Button variant="contained" label="SignOut" onClick={handleLogout}>
            SignOut{''}
          </Button>
        </Stack>
      </Box>
    </>
  );
}
