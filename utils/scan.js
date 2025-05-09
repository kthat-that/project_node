const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRadians = Math.PI / 180;

    if (
        typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
        typeof lat2 !== 'number' || typeof lon2 !== 'number'
    ) {
        throw new Error('Invalid input: Coordinates must be numbers.');
    }

    const dLat = (lat2 - lat1) * toRadians;
    const dLon = (lon2 - lon1) * toRadians;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * toRadians) * Math.cos(lat2 * toRadians) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c * 1000;
};

exports.checkLocation = (userLat, userLon, allowedLocation) => {
    if (
        typeof userLat !== 'number' || typeof userLon !== 'number' ||
        !allowedLocation || typeof allowedLocation.latitude !== 'number' ||
        typeof allowedLocation.longitude !== 'number' || typeof allowedLocation.radius !== 'number'
    ) {
        throw new Error('Invalid input: Please provide valid coordinates and allowed location details.');
    }

    const { latitude, longitude, radius } = allowedLocation;
    const distance = calculateDistance(userLat, userLon, latitude, longitude);

    console.log(`Distance from allowed location: ${distance.toFixed(2)} meters`);

    return distance <= radius;
};

exports.calculateHours = (checkinTime, checkoutTime) => {
    if (!checkinTime || !checkoutTime) {
        return 0; 
    }
    
    const checkin = new Date(checkinTime);
    const checkout = new Date(checkoutTime);

    if (isNaN(checkin) || isNaN(checkout)) {
        throw new Error("Invalid date format");
    }

    const diffInMinutes = Math.floor((checkout - checkin) / (1000 * 60));
    return diffInMinutes / 60; 
};