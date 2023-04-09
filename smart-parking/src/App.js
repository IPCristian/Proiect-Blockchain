import './App.css';
import Web3 from "web3"
import React, { useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Dialog, DialogTitle, DialogContent, DialogActions, Slide, DialogContentText, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material/';

const web3 = new Web3('ws://127.0.0.1:7545');
const SmartParkingABI = require('./SmartParking.json');
const contractAdress = "0x80aA1Ba0eb628C8D295cC2Db3941118EEb52642A";
const contract = new web3.eth.Contract(SmartParkingABI,contractAdress);

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});


// Not used anymore
function WarningDialog({ open, onClose }) {

  const handleClose = () => {
    onClose();
  };

  return (
      <Dialog 
          open={open} 
          TransitionComponent={Transition}
          onClose={handleClose}
          aria-describedby="alert-dialog-slide-description">
        <DialogTitle sx={{ fontSize: '32px', fontFamily: 'roboto'}}>Warning</DialogTitle>
        <DialogContent sx={{ fontFamily: 'roboto', fontSize: '24px'}}>
          <p>You have to connect to a valid wallet before reserving a parking spot.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Ok</Button>
        </DialogActions>
      </Dialog>
  );
}

function ReservationDialog({ open, onClose, selectedSpot, selectedPrice, account, setAccount }) {
  const [selectedHour, setSelectedHour] = useState(null);

  const handleChange = (event) => {
    setSelectedHour(event.target.value);
  };

  const handleConfirm = async () => {
    if (selectedHour != null)
    {
      // console.log(selectedSpot,selectedHour,selectedPrice,account);
      await contract.methods.reserveSpot(selectedSpot,selectedHour).send({
        from: account,
        value: (selectedHour * selectedPrice).toString(),
        gasLimit: 3000000,
      }).then(() => {
        console.log("Reservation successful");
      })
    }
    handleClose();
  }

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle sx={{ marginBottom: "5%" }}>How much would you like to reserve this spot for?</DialogTitle>
        <DialogContent>
            <FormControl sx={{ minWidth: 500 }}>
              <InputLabel id="hour-select-label">Select the number of hours</InputLabel>
              <Select
                labelId="hour-select-label"
                id="hour-select"
                value={selectedHour}
                label="Select the number of hours"
                onChange={handleChange}
              >
                <MenuItem value="1">1 hour</MenuItem>
                <MenuItem value="2">2 hours</MenuItem>
                <MenuItem value="3">3 hours</MenuItem>
                <MenuItem value="4">4 hours</MenuItem>
                <MenuItem value="5">5 hours</MenuItem>
                <MenuItem value="6">6 hours</MenuItem>
                <MenuItem value="7">7 hours</MenuItem>
                <MenuItem value="8">8 hours</MenuItem>
                <MenuItem value="9">9 hours</MenuItem>
                <MenuItem value="10">10 hours</MenuItem>
                <MenuItem value="11">11 hours</MenuItem>
                <MenuItem value="12">12 hours</MenuItem>
              </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button sx={{ fontSize: '16px', textWeight: 'bold' }} onClick={handleConfirm}>Confirm</Button>
        </DialogActions>
    </Dialog>
  );
}

function UpdateDialog({ open, onClose, selectedSpot, account }) {
  const [selectedPrice, setSelectedPrice] = useState('');

  const handleChange = (event) => {
    setSelectedPrice(event.target.value);
  };

  const handleConfirm = async () => {
    if (selectedPrice != '')
    {
      // console.log(selectedSpot,selectedPrice,account);
      await contract.methods.updateParkingSpot(selectedSpot,selectedPrice).send({
        from: account
        }).then(() => {
        console.log("Update successful");
      })
    }
    handleClose();
  }

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle sx={{ marginBottom: "5%" }}>What price would you like to update the spot to ?</DialogTitle>
        <DialogContent>
          <TextField
          label="New Price"
          value={selectedPrice}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button sx={{ fontSize: '16px', textWeight: 'bold' }} onClick={handleConfirm}>Confirm</Button>
        </DialogActions>
    </Dialog>
  );
}


function AddSpot({ open, onClose, account }) {
  const [selectedPrice, setSelectedPrice] = useState('');

  const handleChange = (event) => {
    setSelectedPrice(event.target.value);
  };

  const handleConfirm = async () => {
    if (selectedPrice != '')
    {
      // console.log(selectedSpot,selectedPrice,account);
      await contract.methods.addParkingSpot(selectedPrice).send({
        from: account
      }).then(() => {
        console.log("Added successful");
      })
    }
    handleClose();
  }

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle sx={{ marginBottom: "5%" }}>What price would you like for the new spot to have ?</DialogTitle>
        <DialogContent>
          <TextField
          label="New Price"
          value={selectedPrice}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button sx={{ fontSize: '16px', textWeight: 'bold' }} onClick={handleConfirm}>Confirm</Button>
        </DialogActions>
    </Dialog>
  );
}


function App() {

  const [account, setAccount] = useState(null);
  const [spots, setSpots] = useState([]);
  const [owner, setOwner] = useState(null);
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [selectedSpot, setCurrentSpot] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);

  useEffect(() => {
    // Fetch the list of parking spots
    async function fetchData() {

      const parkingSpotsCount = await contract.methods.parkingSpotsCount().call();
      const parkingSpots = [];

      for (let i = 0; i < parkingSpotsCount; i++) {
        const parkingSpot = await contract.methods.parkingSpots(i).call();
        parkingSpots.push(parkingSpot);
      }

      setSpots(parkingSpots);

      const owner = await contract.methods.owner().call();
      setOwner(owner.toLowerCase());

      contract.events.ParkingSpotAdded({}, async (error,result) => {
        if (error) {
          console.log(error);
          return;
        }

        const newParkingSpot = await contract.methods.parkingSpots(result.id).call();
        parkingSpots.push(newParkingSpot);
        setSpots(parkingSpots);
      })

    }

    const parkingSpotAddedEvent = contract.events.ParkingSpotAdded({});
    parkingSpotAddedEvent.on('data', (event) => {
      fetchData();
    });

    const parkingSpotUpdatedEvent = contract.events.ParkingSpotUpdated({});
    parkingSpotUpdatedEvent.on('data', (event) => {
      fetchData();
    });

    const reservationMadeEvent = contract.events.ReservationMade({});
    reservationMadeEvent.on('data', (event) => {
      fetchData();
    });

    const reservationCanceledEvent = contract.events.ReservationCanceled({});
    reservationCanceledEvent.on('data', (event) => {
      fetchData();
    });

    fetchData();
  }, []);

  // Connect to MetaMask
  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0].toLowerCase());
      } catch (error) {
        console.error(error);
      }
    } else {
      alert('Please install MetaMask to connect your wallet.');
    }
  }

  // Keep the active wallet updated
  window.ethereum.on('accountsChanged', newAccounts => {
    setAccount(newAccounts[0]);
  });

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  const showReservation = (id, hourlyRate) => {
    if (account)
    {
      setShowReservationDialog(true);
      setCurrentSpot(id);
      setSelectedPrice(hourlyRate);
    }
    else
    {
      setShowWarningDialog(true);
    }
  };

  const updatePrice = (id) => {
    if (account)
    {
      setShowUpdateDialog(true);
      setCurrentSpot(id);
    }
    else
    {
      setShowWarningDialog(true);
    }
  }

  const AddSpot = (id) => {
    if (account)
    {
      setShowAddSpot(true);
      setCurrentSpot(id);
    }
    else
    {
      setShowWarningDialog(true);
    }
  }

  const handleCloseDialog = () => {
    setShowReservationDialog(false);
    setShowUpdateDialog(false);
    setShowWarningDialog(false);
    setShowAddSpot(false);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      {account ? 
      <div className="App" sx={{ width: '80%' }}>
      <h3>Reserve a parking spot</h3>
      <h2><div className="Wallet">Current connected wallet:<br/>{account}</div></h2>
      <TableContainer component={Paper} sx={{  width: '70%', margin: 'auto', overflow: 'auto', maxHeight: '35em'}}>
          <Table sx={{ minWidth: 650 }} aria-label="parking spots table">
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ fontSize: '25px'}}>Parking Spot ID</TableCell>
                  <TableCell align="center" sx={{ fontSize: '25px'}}>Hourly Rate</TableCell>
                  {owner === account? <TableCell align="center" sx={{ fontSize: '25px'}}>Update Price</TableCell> : <TableCell align="center" sx={{ fontSize: '25px'}}>Availability</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
            {spots.map((parkingSpot) => {
              return <TableRow
              key={parkingSpot.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell align="center" sx={{ fontSize: '25px'}}>{parkingSpot.id}</TableCell>
              <TableCell align="center" sx={{ fontSize: '25px'}}>{(parkingSpot.hourlyRate*(10**-18)).toFixed(8)} Ether</TableCell>
                {owner === account? <TableCell align="center"><Button variant="contained" sx={{ backgroundColor: '#553c9a',
                padding: '4%', paddingLeft: '8%', paddingRight: '8%', fontSize: '15px', fontWeight: 'bold', borderRadius: 8, color: 'white'}} onClick={() => updatePrice(parkingSpot.id)}>Update</Button></TableCell> : 
                <TableCell align="center">{parkingSpot.available? <Button variant="contained" sx={{ backgroundColor: '#553c9a',
                padding: '4%', paddingLeft: '8%', paddingRight: '8%', fontSize: '15px', fontWeight: 'bold', borderRadius: 8, color: 'white'}} onClick={() => showReservation(parkingSpot.id, parkingSpot.hourlyRate)}>Reserve</Button> :
                <Button variant="contained" disabled sx={{ backgroundColor: '#553c9a',
                padding: '4%', paddingLeft: '8%', paddingRight: '8%', fontSize: '15px', fontWeight: 'bold', borderRadius: 8, color: 'white'}} onClick={connectWallet}>Occupied</Button>}</TableCell> }
            </TableRow>
            })}
            </TableBody>
          </Table>
        </TableContainer>
        {account == owner? <Button variant="contained" sx={{ marginTop: '2%', backgroundColor: '#553c9a', padding: '1%', fontSize: '25px', fontWeight: 'bold', borderRadius: 24, color: 'white'}} onClick={AddSpot}>Add new Parking spot</Button> : <></>}
        <ReservationDialog open={showReservationDialog} onClose={handleCloseDialog} selectedSpot={selectedSpot} selectedPrice={selectedPrice} account={account} setAccount={setAccount}/>
        <UpdateDialog open={showUpdateDialog} onClose={handleCloseDialog} selectedSpot={selectedSpot} account={account}/>
        <AddSpot open={showAddSpot} onClose={handleCloseDialog} account={account}/>
       <WarningDialog open={showWarningDialog} onClose={handleCloseDialog}/></div> : <div>{owner ? 
      <div className="App" sx={{ width: '80%' }}>
        <h1>Welcome to the<br/> Parking Revolution</h1>
        {account? <div className="Wallet">Current connected wallet:<br/>{account}</div> : 
        <Button variant="contained" sx={{ marginTop: '10%', backgroundColor: '#553c9a', padding: '1%', fontSize: '25px', fontWeight: 'bold', borderRadius: 24, color: 'white'}}
        onClick={connectWallet}>Connect Wallet</Button>}
      </div>
      : <div className="App" sx={{ width: '80%' }}><h1>Welcome to the<br/> Parking Revolution<br/><Button variant="contained" sx={{ marginTop: '10%', backgroundColor: '#553c9a', padding: '1%', fontSize: '25px', fontWeight: 'bold', borderRadius: 24, color: 'white'}}
      onClick={connectWallet}>Connect Wallet</Button></h1></div>}
      </div>}
    </ThemeProvider>
  );
}

export default App;