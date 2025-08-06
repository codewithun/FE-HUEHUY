export const distanceConvert = (distance) => {
  let km = parseInt(distance);

  if (km < 1) {
    return parseInt(distance * 1000) + ' M';
  } else {
    return km + ' KM';
  }
};
