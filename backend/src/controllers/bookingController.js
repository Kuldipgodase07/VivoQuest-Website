exports.createBooking = (req, res) => {
  const { serviceId, patientDetails, scheduledDate, address } = req.body;
  const booking = {
    bookingId: 'VQ-' + Math.floor(100000 + Math.random() * 900000),
    serviceId,
    patientDetails,
    scheduledDate,
    address,
    status: 'CONFIRMED',
    assignedCaregiver: {
      name: 'Rachana Shrestha',
      badgeId: 'VQ-NURSE-449',
      verified: true
    },
    createdAt: new Date().toISOString()
  };
  res.status(201).json({ success: true, data: booking });
};
