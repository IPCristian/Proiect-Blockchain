// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SmartParking {

    struct ParkingSpot {
        uint id;
        bool available;
        uint hourlyRate;
    }

    struct Reservation {
        uint parkingSpotId;
        address user;
        uint startTime;
        uint endTime;
    }

    mapping(uint => ParkingSpot) public parkingSpots;
    mapping(uint => Reservation) public reservations;
    uint public parkingSpotsCount = 0;
    uint public reservationsCount = 0;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    event ParkingSpotAdded(uint id, uint hourlyRate);
    event ParkingSpotUpdated(uint id, uint hourlyRate);
    event ReservationMade(uint reservationId, uint parkingSpotId, address user, uint startTime, uint endTime);
    event ReservationCanceled(uint reservationId);

    function addParkingSpot(uint hourlyRate) public returns (uint) {
        require(msg.sender == owner, "Only an owner can access this function");
        parkingSpots[parkingSpotsCount] = ParkingSpot(parkingSpotsCount, true, hourlyRate);
        emit ParkingSpotAdded(parkingSpotsCount, hourlyRate);
        parkingSpotsCount++;
        return parkingSpotsCount - 1;
    }

    function updateParkingSpot(uint id, uint hourlyRate) public {
        require(msg.sender == owner, "Only an owner can access this function");
        require(id < parkingSpotsCount, "Invalid parking spot ID");
        parkingSpots[id].hourlyRate = hourlyRate;
        emit ParkingSpotUpdated(id, hourlyRate);
    }

    function reserveSpot(uint parkingSpotId, uint numberOfHours) public payable {
        require(parkingSpotId < parkingSpotsCount, "Invalid parking spot ID");
        require(parkingSpots[parkingSpotId].available, "Parking spot is not available");

        uint cost = parkingSpots[parkingSpotId].hourlyRate * numberOfHours;
        require(msg.value >= cost, "Insufficient funds");

        reservations[reservationsCount] = Reservation(parkingSpotId, msg.sender, block.timestamp, block.timestamp + numberOfHours*3600);
        parkingSpots[parkingSpotId].available = false;
        emit ReservationMade(reservationsCount, parkingSpotId, msg.sender, block.timestamp, block.timestamp + numberOfHours*3600);
        reservationsCount++;

        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
    }

    function cancelReservation(uint reservationId) public {
        require(reservationId < reservationsCount, "Invalid reservation ID");
        Reservation storage reservation = reservations[reservationId];
        require(reservation.user == msg.sender, "Not authorized to cancel reservation");

        parkingSpots[reservation.parkingSpotId].available = true;
        emit ReservationCanceled(reservationId);
        delete reservations[reservationId];
        reservationsCount--;

        uint refund = parkingSpots[reservation.parkingSpotId].hourlyRate * ((reservation.endTime - reservation.startTime) / 3600);
        payable(msg.sender).transfer(refund);
    }

}
