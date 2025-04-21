const fs = require('fs');
const proj4 = require('proj4');

const inputFilePath = 'csvjson.json';

proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 " +
    "+x_0=400000 +y_0=-100000 +ellps=airy " +
    "+towgs84=446.448,-125.157,542.06,0.1502,0.247,0.8421,-20.4894 +units=m +no_defs");

fs.readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
        console.log("Error reading the file:", err);
        return;
    }

    const munros = JSON.parse(data);

    const filteredMunros = munros
    .filter(munro => munro.latestDate === "MUN")
    .map(munro => {
        const [lon, lat] = proj4("EPSG:27700", "WGS84", [munro.xcoord, munro.ycoord]);

        return {
            name: munro.Name,
            longitude: lon,
            latitude: lat,
            height: munro.Height,
            hillbagging: munro.hillbagging,
        };
    });

    const outputFilePath = 'filtered_munros.json';

    fs.writeFile(outputFilePath, JSON.stringify(filteredMunros, null, 2), (err) => {
        if (err) {
            console.log("Error writing the file:", err);
            return;
        }
        console.log("Munros added: ", filteredMunros.length);
        console.log("Filtered data has been saved to", outputFilePath);
    });

    function convertToDecimalDegrees(value, direction = 'S') {
        // Ensure value is a number and 6 digits (e.g., 145020)
        const str = value.toString().padStart(6, '0');

        const degrees = parseInt(str.slice(0, 3), 10);
        const minutes = parseInt(str.slice(3, 5), 10);
        const seconds = parseInt(str.slice(5, 6) + '0', 10); // seconds as 20 (from 2 -> 20)

        const decimal = degrees + minutes / 60 + seconds / 3600;

        // Apply negative sign for West or South coordinates
        return (direction === 'W' || direction === 'S') ? -decimal : decimal;
    }
});